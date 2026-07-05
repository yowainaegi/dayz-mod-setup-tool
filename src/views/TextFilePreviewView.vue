<template>
  <div class="preview-shell" @keydown.esc="close">
    <section class="preview-panel">
      <header class="preview-header">
        <div class="preview-title-area">
          <FluentIcon name="document" :size="18" />
          <h3 :title="previewData.title">{{ previewData.title }}</h3>
        </div>
        <div class="preview-window-actions">
          <button class="preview-window-button" type="button" @click="minimize">
            <FluentIcon name="subtract" :size="14" />
          </button>
          <button class="preview-window-button" type="button" @click="toggleMaximize">
            <FluentIcon :name="isMaximized ? 'square-multiple' : 'square'" :size="14" />
          </button>
          <button class="preview-window-button preview-close" type="button" @click="close">
            <FluentIcon name="dismiss" :size="16" />
          </button>
        </div>
      </header>

      <div class="preview-path-row">
        <div class="preview-path" :title="previewData.filePath">{{ previewData.filePath }}</div>
        <span v-if="isShowingSavedCopy" class="preview-state-badge">{{ $t('TextFilePreviewView.savedCopy') }}</span>
        <button class="preview-path-button" type="button" :title="$t('TextFilePreviewView.openContainingFolder')" @click="showInFolder">
          <FluentIcon name="folder-open" :size="16" />
        </button>
        <button
          class="preview-path-button"
          type="button"
          :title="$t('TextFilePreviewView.editToolCopy')"
          :disabled="!canEdit"
          @click="openEditor"
        >
          <FluentIcon name="edit" :size="16" />
        </button>
      </div>

      <main class="preview-body">
        <div class="preview-path-details">
          <div class="preview-path-detail">
            <span>{{ $t('TextFilePreviewView.source') }}</span>
            <code :title="sourcePath">{{ sourcePath }}</code>
          </div>
          <div v-if="isShowingSavedCopy" class="preview-path-detail">
            <span>{{ $t('TextFilePreviewView.savedCopy') }}</span>
            <code :title="savedCopyPath">{{ savedCopyPath }}</code>
          </div>
        </div>
        <a-alert
          v-if="previewData.isTruncated"
          class="preview-alert"
          :message="$t('TextFilePreviewView.truncatedWarning')"
          type="warning"
          show-icon
        />
        <a-alert
          v-if="previewData.error"
          class="preview-alert"
          :message="previewData.error"
          type="error"
          show-icon
        />
        <pre
          v-if="!previewData.error"
          class="preview-content"
          v-html="previewContentHtml"
        ></pre>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FluentIcon from '@/components/common/FluentIcon/index.vue';

interface TextFilePreviewData {
  title: string;
  filePath: string;
  content: string;
  isTruncated: boolean;
  serverFolderPath?: string;
  modFolderName?: string;
  selectedType?: string;
  saveSourcePath?: string;
  error?: string;
}

const previewData = ref<TextFilePreviewData>({
  title: 'File Preview',
  filePath: '',
  content: '',
  isTruncated: false,
});
const isMaximized = ref(false);
const canEdit = ref(false);

const sourcePath = computed(() => previewData.value.saveSourcePath || previewData.value.filePath);
const savedCopyPath = computed(() => previewData.value.filePath);
const isShowingSavedCopy = computed(() => {
  return Boolean(previewData.value.saveSourcePath && previewData.value.saveSourcePath !== previewData.value.filePath);
});

const isXmlContent = computed(() => {
  const filePath = previewData.value.filePath.toLowerCase();
  const content = previewData.value.content.trimStart();
  return filePath.endsWith('.xml') || content.startsWith('<?xml') || /^<[\w:-]+[\s>/]/.test(content);
});

const previewContentHtml = computed(() => {
  return isXmlContent.value
    ? highlightXml(previewData.value.content)
    : escapeHtml(previewData.value.content);
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

function close(): void {
  window.ipcRenderer.invoke('closeTextFilePreview');
}

function showInFolder(): void {
  window.ipcRenderer.invoke('showTextFilePreviewInFolder');
}

function openEditor(): void {
  if (!previewData.value.serverFolderPath || !previewData.value.modFolderName) {
    return;
  }

  window.ipcRenderer.invoke(
    'showTextFileEditor',
    previewData.value.filePath,
    previewData.value.title,
    previewData.value.serverFolderPath,
    previewData.value.modFolderName,
    previewData.value.selectedType,
    previewData.value.saveSourcePath
  );
}

function minimize(): void {
  window.ipcRenderer.invoke('minimizeTextFilePreview');
}

async function toggleMaximize(): Promise<void> {
  isMaximized.value = await window.ipcRenderer.invoke('toggleMaximizeTextFilePreview');
}

onMounted(async () => {
  const data = await window.ipcRenderer.invoke('getTextFilePreviewData');
  if (data) {
    previewData.value = data;
    canEdit.value = Boolean(data.serverFolderPath && data.modFolderName);
  }
  isMaximized.value = await window.ipcRenderer.invoke('isTextFilePreviewMaximized');
});
</script>

<style scoped lang="less">
.preview-shell {
  width: 100vw;
  height: 100vh;
  background: var(--app-color-bg-content);
  color: var(--app-color-text);
}

.preview-panel {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
  background: var(--app-color-bg-content);
}

.preview-header {
  height: var(--app-titlebar-height);
  padding: 0 0 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-color-bg);
  -webkit-app-region: drag;
}

.preview-title-area {
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

.preview-window-actions {
  display: flex;
  align-items: center;
  align-self: stretch;
  -webkit-app-region: no-drag;
}

.preview-window-button {
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

.preview-close {
  &:hover {
    background: var(--app-color-error);
  }
}

.preview-path-row {
  min-width: 0;
  margin-top: 10px;
  padding: 0 16px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-path {
  min-width: 0;
  flex: 1;
  color: var(--app-color-text);
  opacity: 0.82;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-state-badge {
  flex: none;
  min-height: 24px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  color: var(--app-color-text-heading);
  background: var(--app-color-primary-soft);
  border: 1px solid var(--app-color-primary);
  font-size: 12px;
}

.preview-path-button {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--app-color-border-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  color: var(--app-color-text);
  background: var(--app-color-bg-container);
  cursor: default;
}

.preview-path-button:hover {
  color: var(--app-color-text-heading);
  background: var(--app-color-appbar-hover-bg);
}

.preview-path-button:disabled {
  opacity: 0.45;
  color: var(--app-color-text);
  background: var(--app-color-bg-container);
}

.preview-body {
  min-height: 0;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-alert {
  margin-bottom: 10px;
}

.preview-path-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.preview-path-detail {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 26px;
  color: var(--app-color-text);
  font-size: 12px;
}

.preview-path-detail span {
  color: var(--app-color-text-secondary);
}

.preview-path-detail code {
  min-width: 0;
  padding: 4px 6px;
  color: var(--app-color-text);
  background: var(--app-color-bg-container);
  border: 1px solid var(--app-color-border-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-content {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 12px;
  box-sizing: border-box;
  color: var(--app-color-text);
  background: var(--app-color-bg-container);
  border: 1px solid var(--app-color-border-secondary);
  font-family: Consolas, 'Cascadia Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow: auto;
}

:global(.preview-content .xml-comment) {
  color: var(--app-color-code-comment);
}

:global(.preview-content .xml-declaration) {
  color: var(--app-color-code-keyword);
}

:global(.preview-content .xml-tag-bracket) {
  color: var(--app-color-code-muted);
}

:global(.preview-content .xml-tag-name) {
  color: var(--app-color-code-tag);
}

:global(.preview-content .xml-attr) {
  color: var(--app-color-code-attribute);
}

:global(.preview-content .xml-value) {
  color: var(--app-color-code-string);
}
</style>
