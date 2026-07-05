<template>
  <div class="editor-shell" @keydown.esc="close">
    <section class="editor-panel">
      <header class="editor-header">
        <div class="editor-title-area">
          <FluentIcon name="document" :size="18" />
          <h3 :title="editorData.title">{{ editorData.title }}</h3>
        </div>
        <div class="editor-window-actions">
          <button class="editor-window-button" type="button" @click="minimize">
            <FluentIcon name="subtract" :size="14" />
          </button>
          <button class="editor-window-button" type="button" @click="toggleMaximize">
            <FluentIcon :name="isMaximized ? 'square-multiple' : 'square'" :size="14" />
          </button>
          <button class="editor-window-button editor-close" type="button" @click="close">
            <FluentIcon name="dismiss" :size="16" />
          </button>
        </div>
      </header>

      <div class="editor-toolbar">
        <div class="editor-path" :title="editorData.filePath">{{ editorData.filePath }}</div>
        <span v-if="isEditingSavedCopy" class="editor-state-badge">{{ $t('TextFileEditorView.editingSavedCopy') }}</span>
        <a-select v-model:value="selectedType" class="editor-type-select">
          <a-select-option v-for="type in ceConfigTypes" :key="type" :value="type">
            {{ type }}
          </a-select-option>
        </a-select>
        <a-button :disabled="!isXmlContent || Boolean(editorData.error)" @click="formatXmlContent">
          {{ $t('TextFileEditorView.formatXml') }}
        </a-button>
        <a-button :disabled="!isEditingSavedCopy || Boolean(editorData.error) || isSaving" @click="revertToSource">
          {{ $t('TextFileEditorView.revert') }}
        </a-button>
        <a-button type="primary" :loading="isSaving" :disabled="!selectedType || Boolean(editorData.error)" @click="save">
          {{ $t('TextFileEditorView.save') }}
        </a-button>
      </div>

      <main class="editor-body">
        <div class="editor-path-details">
          <div class="editor-path-detail">
            <span>{{ $t('TextFileEditorView.source') }}</span>
            <code :title="sourcePath">{{ sourcePath }}</code>
          </div>
          <div v-if="isEditingSavedCopy" class="editor-path-detail">
            <span>{{ $t('TextFileEditorView.savedCopy') }}</span>
            <code :title="savedCopyPath">{{ savedCopyPath }}</code>
          </div>
        </div>
        <a-alert
          v-if="editorData.error"
          class="editor-alert"
          :message="editorData.error"
          type="error"
          show-icon
        />
        <a-alert
          v-if="saveMessage"
          class="editor-alert"
          :message="saveMessage"
          type="success"
          show-icon
          closable
          @close="saveMessage = ''"
        />
        <a-alert
          v-if="saveError"
          class="editor-alert"
          :message="saveError"
          type="error"
          show-icon
          closable
          @close="saveError = ''"
        />
        <div v-if="!editorData.error" class="editor-code-wrap">
          <pre
            ref="highlightRef"
            class="editor-highlight"
            aria-hidden="true"
            v-html="highlightedContent"
          ></pre>
          <textarea
            ref="textareaRef"
            v-model="content"
            class="editor-content"
            spellcheck="false"
            @scroll="syncHighlightScroll"
            @keydown.tab.prevent="handleTabKey"
          />
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import { CE_CONFIG_TYPES } from '@/services/modSetup/constants';
import type { CeConfigType } from '@/services/modSetup/types';
import ResData from '@/server/models/ResData';
import { confirmNativeDialog } from '@/utils/nativeDialog';
import { i18n } from '@/i18n';

interface TextFileEditorData {
  title: string;
  filePath: string;
  content: string;
  isTruncated: boolean;
  serverFolderPath: string;
  modFolderName: string;
  selectedType?: CeConfigType;
  saveSourcePath?: string;
  error?: string;
}

const ceConfigTypes = CE_CONFIG_TYPES;
const editorData = ref<TextFileEditorData>({
  title: 'File Editor',
  filePath: '',
  content: '',
  isTruncated: false,
  serverFolderPath: '',
  modFolderName: '',
});
const content = ref('');
const selectedType = ref<CeConfigType | undefined>(undefined);
const isMaximized = ref(false);
const isSaving = ref(false);
const saveMessage = ref('');
const saveError = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const highlightRef = ref<HTMLElement | null>(null);

const isXmlContent = computed(() => {
  const filePath = editorData.value.filePath.toLowerCase();
  return filePath.endsWith('.xml') || content.value.trimStart().startsWith('<?xml') || /^<[\w:-]+[\s>/]/.test(content.value.trimStart());
});

const highlightedContent = computed(() => {
  return highlightXml(content.value);
});
const sourcePath = computed(() => editorData.value.saveSourcePath || editorData.value.filePath);
const savedCopyPath = computed(() => editorData.value.filePath);
const isEditingSavedCopy = computed(() => {
  return Boolean(editorData.value.saveSourcePath && editorData.value.saveSourcePath !== editorData.value.filePath);
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightXml(value: string): string {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;\?[\s\S]*?\?&gt;)|(&lt;\/?)([\w:.-]+)((?:\s+[\w:.-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?&gt;)/g,
    (_match, comment, declaration, tagStart, tagName, attrs, tagEnd) => {
      if (comment) {
        return `<span class="xml-comment">${comment}</span>`;
      }
      if (declaration) {
        return `<span class="xml-declaration">${declaration}</span>`;
      }

      const highlightedAttrs = attrs
        ? attrs.replace(/([\w:.-]+)(=)("[^"]*"|'[^']*')/g, '<span class="xml-attr">$1</span>$2<span class="xml-value">$3</span>')
        : '';
      return `<span class="xml-tag-bracket">${tagStart}</span><span class="xml-tag-name">${tagName}</span>${highlightedAttrs}<span class="xml-tag-bracket">${tagEnd}</span>`;
    }
  );
}

function syncHighlightScroll(): void {
  if (!textareaRef.value || !highlightRef.value) {
    return;
  }
  highlightRef.value.scrollTop = textareaRef.value.scrollTop;
  highlightRef.value.scrollLeft = textareaRef.value.scrollLeft;
}

function tokenizeXmlLike(value: string): string[] {
  const tokens: string[] = [];
  let index = 0;

  while (index < value.length) {
    const tagStart = value.indexOf('<', index);
    if (tagStart === -1) {
      tokens.push(value.substring(index));
      break;
    }

    if (tagStart > index) {
      tokens.push(value.substring(index, tagStart));
    }

    if (value.startsWith('<!--', tagStart)) {
      const commentEnd = value.indexOf('-->', tagStart + 4);
      if (commentEnd === -1) {
        tokens.push(value.substring(tagStart));
        break;
      }
      tokens.push(value.substring(tagStart, commentEnd + 3));
      index = commentEnd + 3;
      continue;
    }

    if (value.startsWith('<![CDATA[', tagStart)) {
      const cdataEnd = value.indexOf(']]>', tagStart + 9);
      if (cdataEnd === -1) {
        tokens.push(value.substring(tagStart));
        break;
      }
      tokens.push(value.substring(tagStart, cdataEnd + 3));
      index = cdataEnd + 3;
      continue;
    }

    let tagEnd = tagStart + 1;
    let quote: string | null = null;
    while (tagEnd < value.length) {
      const char = value[tagEnd];
      if ((char === '"' || char === "'") && value[tagEnd - 1] !== '\\') {
        quote = quote === char ? null : (quote || char);
      } else if (char === '>' && !quote) {
        break;
      }
      tagEnd += 1;
    }

    if (tagEnd >= value.length) {
      tokens.push(value.substring(tagStart));
      break;
    }

    tokens.push(value.substring(tagStart, tagEnd + 1));
    index = tagEnd + 1;
  }

  return tokens;
}

function getOpenTagName(token: string): string | null {
  const match = token.match(/^<([\w:.-]+)(\s|>|\/)/);
  return match ? match[1] : null;
}

function formatXml(value: string): string {
  const tokens = tokenizeXmlLike(value);
  const lines: string[] = [];
  let indent = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const rawToken = tokens[i];
    const token = rawToken.trim();
    if (!token) {
      continue;
    }

    const openTagName = getOpenTagName(token);
    const textToken = tokens[i + 1]?.trim();
    const closeToken = tokens[i + 2]?.trim();
    if (
      openTagName &&
      textToken &&
      closeToken === `</${openTagName}>` &&
      !textToken.includes('<') &&
      !token.endsWith('/>')
    ) {
      lines.push(`${'  '.repeat(indent)}${token}${textToken}${closeToken}`);
      i += 2;
      continue;
    }

    if (/^<\//.test(token)) {
      indent = Math.max(indent - 1, 0);
    }

    lines.push(`${'  '.repeat(indent)}${token}`);

    if (
      /^<[^!?/][^>]*>$/.test(token) &&
      !/^<\//.test(token) &&
      !/\/>$/.test(token)
    ) {
      indent += 1;
    }
  }

  return lines.join('\n');
}

function formatXmlContent(): void {
  saveMessage.value = '';
  saveError.value = '';
  try {
    content.value = formatXml(content.value);
    requestAnimationFrame(syncHighlightScroll);
  } catch (error: any) {
    saveError.value = error?.message || error?.toString() || i18n.global.t('TextFileEditorView.xmlFormatFailed');
  }
}

function updateContentSelection(nextContent: string, selectionStart: number, selectionEnd = selectionStart): void {
  content.value = nextContent;
  requestAnimationFrame(() => {
    if (!textareaRef.value) {
      return;
    }
    textareaRef.value.selectionStart = selectionStart;
    textareaRef.value.selectionEnd = selectionEnd;
    syncHighlightScroll();
  });
}

function handleTabKey(): void {
  const textarea = textareaRef.value;
  if (!textarea) {
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = content.value.substring(0, start);
  const after = content.value.substring(end);
  const selectedText = content.value.substring(start, end);
  const tagNameMatch = before.match(/([\w:.-]+)$/);

  if (start === end && tagNameMatch) {
    const tagName = tagNameMatch[1];
    const tagNameStart = start - tagName.length;
    const openCloseTag = `<${tagName}></${tagName}>`;
    updateContentSelection(
      `${content.value.substring(0, tagNameStart)}${openCloseTag}${after}`,
      tagNameStart + tagName.length + 2
    );
    return;
  }

  const indent = selectedText
    ? selectedText.replace(/^/gm, '  ')
    : '  ';
  updateContentSelection(`${before}${indent}${after}`, start + 2, start + indent.length);
}

function close(): void {
  window.ipcRenderer.invoke('closeTextFileEditor');
}

function minimize(): void {
  window.ipcRenderer.invoke('minimizeTextFileEditor');
}

async function toggleMaximize(): Promise<void> {
  isMaximized.value = await window.ipcRenderer.invoke('toggleMaximizeTextFileEditor');
}

async function save(): Promise<void> {
  if (!selectedType.value) {
    return;
  }

  isSaving.value = true;
  saveMessage.value = '';
  saveError.value = '';
  try {
    const res: ResData = await window.ipcRenderer.invoke(
      'serverAPI',
      'saveManualCeConfigCopy',
      editorData.value.serverFolderPath,
      editorData.value.modFolderName,
      editorData.value.saveSourcePath || editorData.value.filePath,
      selectedType.value,
      content.value
    );
    saveMessage.value = i18n.global.t('TextFileEditorView.saveSuccess', { path: res.data.createdCopyPath });
    editorData.value = {
      ...editorData.value,
      filePath: res.data.createdCopyPath,
      saveSourcePath: editorData.value.saveSourcePath || editorData.value.filePath,
      selectedType: selectedType.value
    };
    await window.ipcRenderer.invoke('notifyTextFileEditorSaved');
  } catch (error: any) {
    saveError.value = error?.message || error?.toString() || i18n.global.t('TextFileEditorView.saveFailed');
  } finally {
    isSaving.value = false;
  }
}

async function revertToSource(): Promise<void> {
  if (!editorData.value.saveSourcePath) {
    return;
  }

  const confirmed = await confirmNativeDialog({
    title: i18n.global.t('TextFileEditorView.revertConfirmTitle'),
    message: i18n.global.t('TextFileEditorView.revertConfirmMessage'),
    confirmText: i18n.global.t('TextFileEditorView.revert'),
    cancelText: i18n.global.t('common.modal.confirm.cancel'),
  });
  if (!confirmed) {
    return;
  }

  isSaving.value = true;
  saveMessage.value = '';
  saveError.value = '';
  try {
    const res: ResData = await window.ipcRenderer.invoke(
      'serverAPI',
      'revertManualCeConfigCopy',
      editorData.value.serverFolderPath,
      editorData.value.modFolderName,
      editorData.value.saveSourcePath
    );

    editorData.value = {
      ...editorData.value,
      filePath: res.data.sourcePath,
      saveSourcePath: undefined,
      content: res.data.content,
    };
    content.value = res.data.content || '';
    saveMessage.value = i18n.global.t('TextFileEditorView.revertSuccess');
    await window.ipcRenderer.invoke('notifyTextFileEditorSaved');
    requestAnimationFrame(syncHighlightScroll);
  } catch (error: any) {
    saveError.value = error?.message || error?.toString() || i18n.global.t('TextFileEditorView.revertFailed');
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  const data = await window.ipcRenderer.invoke('getTextFileEditorData');
  if (data) {
    editorData.value = data;
    content.value = data.content || '';
    selectedType.value = data.selectedType;
  }
  isMaximized.value = await window.ipcRenderer.invoke('isTextFileEditorMaximized');
});
</script>

<style scoped lang="less">
.editor-shell {
  width: 100vw;
  height: 100vh;
  background: var(--app-color-bg-content);
  color: var(--app-color-text);
}

.editor-panel {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
  background: var(--app-color-bg-content);
}

.editor-header {
  height: var(--app-titlebar-height);
  padding: 0 0 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-color-bg);
  -webkit-app-region: drag;
}

.editor-title-area {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    color: var(--app-color-text-heading);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.editor-window-actions {
  display: flex;
  align-items: center;
  align-self: stretch;
  -webkit-app-region: no-drag;
}

.editor-window-button {
  width: 40px;
  height: var(--app-titlebar-height);
  padding: 0;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-color-text);
  background: transparent;
  cursor: default;

  &:hover {
    color: var(--app-color-text-heading);
    background: var(--app-color-appbar-hover-bg);
  }
}

.editor-close:hover {
  background: var(--app-color-error);
}

.editor-toolbar {
  min-width: 0;
  padding: 10px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 180px auto auto auto;
  gap: 8px;
  align-items: center;
}

.editor-path {
  min-width: 0;
  color: var(--app-color-text);
  opacity: 0.82;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-type-select {
  width: 180px;
}

.editor-state-badge {
  min-height: 24px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  color: var(--app-color-text-heading);
  background: var(--app-color-primary-soft);
  border: 1px solid var(--app-color-primary);
  font-size: 12px;
  white-space: nowrap;
}

.editor-body {
  min-height: 0;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-path-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.editor-path-detail {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 26px;
  color: var(--app-color-text);
  font-size: 12px;
}

.editor-path-detail span {
  color: var(--app-color-text-secondary);
}

.editor-path-detail code {
  min-width: 0;
  padding: 4px 6px;
  color: var(--app-color-text);
  background: var(--app-color-bg-container);
  border: 1px solid var(--app-color-border-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-alert {
  margin-bottom: 10px;
}

.editor-code-wrap {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  color: var(--app-color-text);
  background: var(--app-color-bg-container);
  border: 1px solid var(--app-color-border-secondary);
  overflow: hidden;
}

.editor-highlight,
.editor-content {
  position: absolute;
  inset: 0;
  margin: 0;
  resize: none;
  padding: 12px;
  box-sizing: border-box;
  border: none;
  outline: none;
  font-family: Consolas, 'Cascadia Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
  tab-size: 2;
  overflow: auto;
}

.editor-highlight {
  pointer-events: none;
  color: var(--app-color-text);
}

.editor-content {
  color: transparent;
  caret-color: var(--app-color-text-heading);
  background: transparent;
}

.editor-content::selection {
  color: transparent;
  background: var(--app-color-primary);
}

:global(.editor-highlight .xml-comment) {
  color: var(--app-color-code-comment);
}

:global(.editor-highlight .xml-declaration) {
  color: var(--app-color-code-keyword);
}

:global(.editor-highlight .xml-tag-bracket) {
  color: var(--app-color-code-muted);
}

:global(.editor-highlight .xml-tag-name) {
  color: var(--app-color-code-tag);
}

:global(.editor-highlight .xml-attr) {
  color: var(--app-color-code-attribute);
}

:global(.editor-highlight .xml-value) {
  color: var(--app-color-code-string);
}
</style>
