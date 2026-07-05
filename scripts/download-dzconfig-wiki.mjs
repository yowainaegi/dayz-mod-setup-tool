import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = 'https://dzconfig.com'
const START_URL = `${BASE_URL}/wiki/`
const OUTPUT_DIR = path.resolve('docs/dzconfig-wiki')

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const slugFromUrl = (url) => {
  const { pathname } = new URL(url)
  const trimmed = pathname.replace(/^\/wiki\/?/, '').replace(/\/$/, '')
  return trimmed ? trimmed.replace(/[^a-z0-9._-]+/gi, '-') : 'index'
}

const canonicalWikiUrl = (url) => {
  const parsed = new URL(url, BASE_URL)
  parsed.hash = ''
  parsed.search = ''
  if (parsed.pathname === '/wiki') parsed.pathname = '/wiki/'
  return parsed.toString()
}

const titleFromHtml = (html, fallback) => {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const title = h1 ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? fallback
  return cleanInline(title).replace(/\s+-\s+DZconfig.*$/i, '').trim()
}

const cleanInline = (html) =>
  decodeEntities(
    html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )

const pickArticleHtml = (html) => {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
  if (main) return main

  const h1Index = html.search(/<h1\b/i)
  if (h1Index >= 0) {
    const footerIndex = html.search(/<footer\b/i)
    return html.slice(h1Index, footerIndex > h1Index ? footerIndex : undefined)
  }

  return html
}

const htmlToMarkdown = (html) => {
  const protectedBlocks = []
  const protect = (text) => {
    const token = `@@DZCONFIG_PROTECTED_${protectedBlocks.length}@@`
    protectedBlocks.push(text)
    return token
  }

  let content = html.replace(/<pre[^>]*>(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?<\/pre>/gi, (_, code) => {
    const decoded = decodeEntities(code.replace(/<[^>]+>/g, ''))
    return protect(`\n\n\`\`\`\n${decoded.trim()}\n\`\`\`\n\n`)
  })

  content = content.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    const decoded = decodeEntities(code.replace(/<[^>]+>/g, '')).trim()
    return protect(decoded.includes('\n') ? `\n\n\`\`\`\n${decoded}\n\`\`\`\n\n` : `\`${decoded}\``)
  })

  content = content
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n# ${cleanInline(text)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n## ${cleanInline(text)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n### ${cleanInline(text)}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n#### ${cleanInline(text)}\n\n`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n${cleanInline(text)}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${cleanInline(text)}`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:ul|ol)>/gi, '\n')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const label = cleanInline(text)
      if (!label) return ''
      const absolute = new URL(href, BASE_URL).toString()
      return `[${label}](${absolute})`
    })
    .replace(/<table[\s\S]*?<\/table>/gi, (table) => {
      const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
        [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => cleanInline(cell[1])),
      )
      if (!rows.length) return ''
      const width = Math.max(...rows.map((row) => row.length))
      const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill('')])
      const header = normalized[0]
      const body = normalized.slice(1)
      return `\n\n| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n${body
        .map((row) => `| ${row.join(' | ')} |`)
        .join('\n')}\n\n`
    })
    .replace(/<[^>]+>/g, '')

  const markdown = decodeEntities(content)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return protectedBlocks.reduce((result, block, index) => result.replaceAll(`@@DZCONFIG_PROTECTED_${index}@@`, block), markdown)
}

const extractWikiLinks = (html, currentUrl) => {
  const links = new Set()
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const url = new URL(match[1], currentUrl)
    if (url.origin !== BASE_URL) continue
    if (!url.pathname.startsWith('/wiki')) continue
    if (url.pathname.includes('/login')) continue
    links.add(canonicalWikiUrl(url))
  }
  return [...links]
}

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'dayz-mod-setup-tool documentation mirror',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.text()
}

const pages = new Map()
const queue = [canonicalWikiUrl(START_URL)]
const seen = new Set()

while (queue.length) {
  const url = queue.shift()
  if (seen.has(url)) continue
  seen.add(url)

  const html = await fetchText(url)
  pages.set(url, html)

  for (const link of extractWikiLinks(html, url)) {
    if (!seen.has(link) && !queue.includes(link)) queue.push(link)
  }
}

await rm(OUTPUT_DIR, { recursive: true, force: true })
await mkdir(OUTPUT_DIR, { recursive: true })

const entries = [...pages.entries()].sort(([left], [right]) => slugFromUrl(left).localeCompare(slugFromUrl(right)))

for (const [url, html] of entries) {
  const title = titleFromHtml(html, slugFromUrl(url))
  const body = htmlToMarkdown(pickArticleHtml(html))
  const markdown = `---\nsource: ${url}\ntitle: ${title}\ndownloaded: ${new Date().toISOString()}\n---\n\n${body}\n`
  await writeFile(path.join(OUTPUT_DIR, `${slugFromUrl(url)}.md`), markdown, 'utf8')
}

const index = [
  '# DZconfig Wiki Local Documentation',
  '',
  `Downloaded from ${START_URL}`,
  `Page count: ${entries.length}`,
  '',
  ...entries.map(([url, html]) => `- [${titleFromHtml(html, slugFromUrl(url))}](./${slugFromUrl(url)}.md) - ${url}`),
  '',
].join('\n')

await writeFile(path.join(OUTPUT_DIR, 'README.md'), index, 'utf8')

console.log(`Downloaded ${entries.length} pages to ${OUTPUT_DIR}`)
