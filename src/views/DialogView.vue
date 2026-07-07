<template>
  <div class="dialog-shell" @keydown.esc="close(cancelId)">
    <section class="dialog-panel">
      <header class="dialog-header">
        <div class="dialog-title-area">
          <FluentIcon :name="iconName" :color="iconColor" :size="22" />
          <h3>{{ dialogOptions.title }}</h3>
        </div>
        <button class="dialog-close" type="button" @click="close(cancelId)">
          <FluentIcon name="dismiss" :size="16" />
        </button>
      </header>

      <main class="dialog-body">
        <p>{{ dialogOptions.message }}</p>
        <p v-if="dialogOptions.detail" class="dialog-detail">{{ dialogOptions.detail }}</p>
      </main>

      <footer class="dialog-footer">
        <a-button
          v-for="(button, index) in dialogOptions.buttons"
          :key="`${button}-${index}`"
          :type="index === dialogOptions.defaultId ? 'primary' : 'default'"
          @click="close(index)"
        >
          {{ button }}
        </a-button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import type { FluentIconName } from '@/components/common/FluentIcon/icons';

interface DialogOptions {
  type: 'none' | 'info' | 'error' | 'question' | 'warning';
  title: string;
  message: string;
  detail: string;
  buttons: string[];
  defaultId: number;
  cancelId: number;
}

const dialogOptions = ref<DialogOptions>({
  type: 'none',
  title: '',
  message: '',
  detail: '',
  buttons: ['OK'],
  defaultId: 0,
  cancelId: 0,
});

const cancelId = computed(() => dialogOptions.value.cancelId);

const iconName = computed<FluentIconName>(() => {
  switch (dialogOptions.value.type) {
    case 'error':
      return 'dismiss-circle';
    case 'question':
      return 'question';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
});

const iconColor = computed(() => {
  switch (dialogOptions.value.type) {
    case 'error':
      return 'var(--app-color-error)';
    case 'question':
      return 'var(--app-color-primary)';
    case 'warning':
      return 'var(--app-color-warning)';
    case 'info':
      return 'var(--app-color-success)';
    default:
      return 'var(--app-color-text-heading)';
  }
});

function close(response: number): void {
  window.ipcRenderer.invoke('closeNativeDialog', response);
}

onMounted(async () => {
  const options = await window.ipcRenderer.invoke('getNativeDialogOptions');
  if (options) {
    dialogOptions.value = options;
  }
});
</script>

<style scoped lang="less">
.dialog-shell {
  width: 100vw;
  height: 100vh;
  padding: 0;
  box-sizing: border-box;
  background: var(--app-color-bg-content);
  color: var(--app-color-text);
}

.dialog-panel {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border: none;
  background: var(--app-color-bg-content);
  box-shadow: none;
  box-sizing: border-box;
}

.dialog-header {
  height: var(--app-titlebar-height);
  padding: 0 0 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-color-bg);
  -webkit-app-region: drag;
}

.dialog-title-area {
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

.dialog-close {
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
  -webkit-app-region: no-drag;

  &:hover {
    color: var(--app-color-text-heading);
    background: var(--app-color-error);
  }
}

.dialog-body {
  min-height: 0;
  padding: 10px 22px 10px 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;

  p {
    margin: 0;
    line-height: 1.7;
    color: var(--app-color-text);
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
}

.dialog-detail {
  margin-top: 8px;
  color: var(--app-color-text);
  opacity: 0.82;
}

.dialog-footer {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  background: var(--app-color-bg-content);
}
</style>
