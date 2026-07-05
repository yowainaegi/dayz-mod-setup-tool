const { app, BrowserWindow } = require('electron')
const { mkdir, rm, writeFile } = require('node:fs/promises')
const path = require('node:path')

const BASE_URL = 'https://community.bistudio.com'
const START_URL = `${BASE_URL}/wiki/Category:DayZ`
const OUTPUT_DIR = path.resolve('docs/bistudio-dayz-wiki')

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const canonicalUrl = (value) => {
  const url = new URL(value, BASE_URL)
  url.hash = ''
  url.search = ''
  return url.toString()
}

const slugFromUrl = (value) => {
  const name = decodeURIComponent(new URL(value).pathname.replace(/^\/wiki\//, ''))
  return name
    .replace(/^Category:/, 'category-')
    .replace(/^DayZ:/, 'dayz-')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

const createWindow = async () => {
  await app.whenReady()
  return new BrowserWindow({
    show: false,
    width: 1365,
    height: 1000,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
    },
  })
}

const waitForContent = async (window) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(1000)
    const state = await window.webContents.executeJavaScript(`({
      title: document.title,
      text: document.body.innerText.slice(0, 500),
      hasContent: Boolean(document.querySelector('#mw-content-text')),
    })`)
    if (
      state.hasContent &&
      !/Just a moment|Enable JavaScript|Checking your browser/i.test(`${state.title}\n${state.text}`)
    ) {
      return
    }
  }
  throw new Error(`Timed out waiting for ${window.webContents.getURL()}`)
}

const loadPage = async (window, url) => {
  await window.loadURL(url)
  await waitForContent(window)
}

const extractCategory = async (window) =>
  window.webContents.executeJavaScript(`(() => {
    const absolute = (href) => new URL(href, location.href).href.split('#')[0].split('?')[0]
    const clean = (text) => text.trim().replace(/\\s+/g, ' ')
    const from = (selector) => [...document.querySelectorAll(selector)]
      .map((link) => ({ title: clean(link.textContent), url: absolute(link.getAttribute('href')) }))
      .filter((link) => link.title && link.url.includes('/wiki/'))

    const categories = from('#mw-subcategories a[href*="/wiki/Category:DayZ"]')
    const pages = [
      ...from('#mw-pages a[href*="/wiki/"]'),
      ...from('#mw-content-text a[href*="/wiki/DayZ:"]'),
    ]

    const unique = (items) => [...new Map(items.map((item) => [item.url, item])).values()]
    return {
      title: clean(document.querySelector('#firstHeading')?.textContent || document.title),
      url: location.href.split('#')[0].split('?')[0],
      categories: unique(categories),
      pages: unique(pages),
    }
  })()`)

const extractArticle = async (window) =>
  window.webContents.executeJavaScript(`(() => {
    const absolute = (href) => new URL(href, location.href).href.split('#')[0]
    const clean = (text) => text.replace(/\\u00a0/g, ' ').replace(/[ \\t]+/g, ' ').trim()
    const escapePipes = (text) => text.replace(/\\|/g, '\\\\|')

    const inline = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const tag = node.tagName.toLowerCase()
      if (tag === 'br') return '\\n'
      if (tag === 'code') return '\`' + node.textContent.trim() + '\`'
      if (tag === 'a') {
        const label = clean(node.textContent)
        const href = node.getAttribute('href')
        if (!label) return ''
        if (!href || href.startsWith('#')) return label
        return '[' + label + '](' + absolute(href) + ')'
      }
      return [...node.childNodes].map(inline).join('')
    }

    const block = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return ''
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      if (node.matches('.mw-editsection, .noprint, style, script, noscript, #toc, .toc, .catlinks')) return ''

      const tag = node.tagName.toLowerCase()
      if (/h[1-6]/.test(tag)) {
        const level = Number(tag.slice(1))
        const text = clean(node.textContent.replace(/\\[edit\\]/gi, ''))
        return text ? '\\n' + '#'.repeat(level) + ' ' + text + '\\n\\n' : ''
      }
      if (tag === 'p') {
        const text = clean(inline(node))
        return text ? text + '\\n\\n' : ''
      }
      if (tag === 'pre') {
        return '\\n\`\`\`\\n' + node.textContent.trim() + '\\n\`\`\`\\n\\n'
      }
      if (tag === 'ul' || tag === 'ol') {
        return [...node.children]
          .filter((child) => child.tagName?.toLowerCase() === 'li')
          .map((child, index) => (tag === 'ol' ? (index + 1) + '. ' : '- ') + clean(inline(child)))
          .filter((line) => line.length > 2)
          .join('\\n') + '\\n\\n'
      }
      if (tag === 'table') {
        const rows = [...node.querySelectorAll('tr')].map((row) =>
          [...row.querySelectorAll('th,td')].map((cell) => escapePipes(clean(inline(cell)))),
        ).filter((row) => row.length)
        if (!rows.length) return ''
        const width = Math.max(...rows.map((row) => row.length))
        const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill('')])
        const header = normalized[0]
        const body = normalized.slice(1)
        return '\\n| ' + header.join(' | ') + ' |\\n| ' + header.map(() => '---').join(' | ') + ' |\\n' +
          body.map((row) => '| ' + row.join(' | ') + ' |').join('\\n') + '\\n\\n'
      }
      if (tag === 'dl') {
        return clean(node.innerText) + '\\n\\n'
      }
      if (['div', 'section', 'article'].includes(tag)) {
        return [...node.childNodes].map(block).join('')
      }
      return ''
    }

    const root = document.querySelector('#mw-content-text')
    const title = clean(document.querySelector('#firstHeading')?.textContent || document.title)
    const markdown = root ? [...root.childNodes].map(block).join('').replace(/\\n{3,}/g, '\\n\\n').trim() : ''
    return {
      title,
      url: location.href.split('#')[0].split('?')[0],
      markdown,
    }
  })()`)

app.whenReady().then(async () => {
  const window = await createWindow()
  const categoryQueue = [START_URL]
  const categories = new Map()
  const pages = new Map()

  while (categoryQueue.length) {
    const url = canonicalUrl(categoryQueue.shift())
    if (categories.has(url)) continue
    await loadPage(window, url)
    const category = await extractCategory(window)
    categories.set(url, category)

    for (const child of category.categories) {
      const childUrl = canonicalUrl(child.url)
      if (!categories.has(childUrl) && !categoryQueue.includes(childUrl)) categoryQueue.push(childUrl)
    }

    for (const page of category.pages) {
      pages.set(canonicalUrl(page.url), page)
    }
  }

  await rm(OUTPUT_DIR, { recursive: true, force: true })
  await mkdir(OUTPUT_DIR, { recursive: true })

  const categoryEntries = [...categories.values()].sort((a, b) => a.title.localeCompare(b.title))
  const pageEntries = []

  for (const [url, link] of [...pages.entries()].sort((a, b) => a[1].title.localeCompare(b[1].title))) {
    await loadPage(window, url)
    const article = await extractArticle(window)
    const filename = `${slugFromUrl(url)}.md`
    pageEntries.push({ ...article, fallbackTitle: link.title, filename })
    const title = article.title || link.title
    const body = article.markdown || '_No article body extracted._'
    await writeFile(
      path.join(OUTPUT_DIR, filename),
      `---\nsource: ${url}\ntitle: ${title}\ndownloaded: ${new Date().toISOString()}\n---\n\n# ${title}\n\n${body}\n`,
      'utf8',
    )
  }

  const readme = [
    '# Bohemia Interactive DayZ Wiki Local Documentation',
    '',
    `Downloaded from ${START_URL}`,
    `Category count: ${categoryEntries.length}`,
    `Article count: ${pageEntries.length}`,
    '',
    '## Categories',
    '',
    ...categoryEntries.map((item) => `- [${item.title}](${item.url})`),
    '',
    '## Articles',
    '',
    ...pageEntries.map((item) => `- [${item.title || item.fallbackTitle}](./${item.filename}) - ${item.url}`),
    '',
  ].join('\n')

  await writeFile(path.join(OUTPUT_DIR, 'README.md'), readme, 'utf8')
  console.log(`Downloaded ${pageEntries.length} articles from ${categoryEntries.length} categories to ${OUTPUT_DIR}`)

  await app.quit()
})
