<template>
  <div class="top-nav-bar">
    <div class="title select-disabled">
      <img class="logo" src="@/assets/logo.png" alt="logo" />
      {{ $t('components.TopNavBar.title') }}
    </div>
    <transition name="fade" mode="out-in">
      <div :key="pageTitle" class="page-title select-disabled">
        {{ pageTitle }}
      </div>
    </transition>
    <div class="traffics">
      <div class="traffic-icon" @click="log">
        <FluentIcon name="document" class="icon" />
      </div>

      <div class="traffic-icon" @click="settings">
        <FluentIcon name="settings" class="icon" />
      </div>

      <div class="traffic-icon" @click="resize">
        <FluentIcon name="arrow-autofit-content" class="icon" />
      </div>

      <div class="traffic-icon" @click="minimize">
        <FluentIcon name="subtract" class="icon" />
      </div>

      <div class="traffic-icon" @click="maximize">
        <template v-if="!isMaximized">
          <FluentIcon name="square" class="icon" />
        </template>
        <template v-else>
          <FluentIcon name="square-multiple" class="icon" />
        </template>
      </div>

      <div class="traffic-icon" @click="quit()">
        <FluentIcon name="dismiss" class="icon" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {useStore} from "vuex";
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import { confirmNativeDialog } from '@/utils/nativeDialog';

// 路由
const router = useRouter();
// store
const store = useStore();

// 是否最大化
let isMaximized = ref(false);

// 获取窗体大小
window.ipcRenderer.invoke("winInfo").then((winInfo: any) => {
  store.commit("updateWinInfo", winInfo);
})

// 监听窗体大小重置
window.ipcRenderer.receive("winInfo", (winInfo: any) => {
  isMaximized.value = winInfo.isMaximize;
  store.commit("updateWinInfo", winInfo);
})


// props
defineProps(['pageTitle']);

// 日志列表
const log = () => {
  router.push('/LogList');
}

// 设置
const settings = () => {
  router.push('/Settings');
}

// 重置窗体大小，位置
const resize = () => {
  window.ipcRenderer.send('resize', null);
}

// 最小化
const minimize = (): void => {
  window.ipcRenderer.send('minimize', null);
}

// 最大化
const maximize = () => {
  if(!isMaximized.value) {
    window.ipcRenderer.send('maximize', null);
  } else {
    window.ipcRenderer.send('unmaximize', null);
  }
}

// 退出程序
const quit = () => {
  confirmNativeDialog({
    title: i18n.global.t('common.modal.confirm.title'),
    message: i18n.global.t('components.TopNavBar.quitConfirm'),
    confirmText: i18n.global.t('common.modal.confirm.yes'),
    cancelText: i18n.global.t('common.modal.confirm.cancel'),
  }).then((confirmed) => {
    if (confirmed) {
      window.ipcRenderer.send('quitApplication', null);
    }
  });
}
</script>

<style scoped lang="less">
@import "@/styles/themes/dark.less";

.logo {
  width: 20px;
  height: 20px;
  margin-right: 6px;
}

.top-nav-bar {
  height: 40px;
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  position: relative;
}

.title {
  height: 100%;
  padding-left: 10px;
  display: flex;
  align-items: center;
  color: var(--app-color-text-heading);
}

.page-title {
  position: absolute;
  top: 0;
  left: 50%;
  height: 40px;
  line-height: 40px;
  transform: translateX(-50%);
  color: var(--app-color-text-heading);
}

.traffics {
  height: 100%;
  margin-left: auto;
  display: flex;
  align-items: stretch;
}

.traffic-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-sizing: border-box;
  -webkit-app-region: no-drag;

  .icon {
    width: 1em;
    height: 1em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--app-color-text);
  }

}

.traffic-icon:hover {
  background-color: @mouse-hover-color-base;
  cursor: default;

  .icon {
    color: white;
  }
}

.traffic-icon:last-child:hover {
  background-color: @error-color;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
