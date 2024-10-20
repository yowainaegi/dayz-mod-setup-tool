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
        <FileTextOutlined class="icon" />
      </div>

      <div class="traffic-icon" @click="settings">
        <SettingOutlined class="icon" />
      </div>

      <div class="traffic-icon" @click="resize">
        <AppstoreOutlined class="icon" />
      </div>

      <div class="traffic-icon" @click="minimize">
        <MinusOutlined class="icon" />
      </div>

      <div class="traffic-icon" @click="maximize">
        <div v-if="!isMaximized">
          <BorderOutlined class="icon" />
        </div>
        <div v-if="isMaximized">
          <BlockOutlined class="icon unmaximize" />
        </div>
      </div>

      <div class="traffic-icon" @click="quit()">
        <CloseOutlined class="icon" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Modal } from 'ant-design-vue';
import { MinusOutlined, BorderOutlined, FileTextOutlined, SettingOutlined, CloseOutlined, BlockOutlined, AppstoreOutlined } from '@ant-design/icons-vue';
import { i18n } from '@/i18n';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {ipcRenderer} from "electron";
import {useStore} from "vuex";

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
ipcRenderer.on("winInfo", (event, winInfo) => {
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
  Modal.confirm({
    okText: i18n.global.t('common.modal.confirm.yes'),
    cancelText: i18n.global.t('common.modal.confirm.cancel'),
    title: i18n.global.t('components.TopNavBar.quitConfirm'),
    icon: '',
    content: '',
    centered: true,
    bodyStyle: {"text-align": "center"},
    onOk() {
      window.ipcRenderer.send('quitApplication', null);
    },
    onCancel() {
      // this.visible = false;
    },
  });
}
</script>

<style scoped lang="less">
@import "@/styles/themes/dark.less";

.logo {
  width: 5%;
}

.top-nav-bar {
  height: 40px;
  -webkit-app-region: drag;
  line-height: 40px;
}

.title,
.traffics {
  display: inline-block;
}

.title {
  padding-left: 10px;
}

.page-title {
  display: inline-block;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
}

.traffics {
  float: right;
}

.traffic-icon {
  display: inline-block;
  text-align: center;
  padding: 0 5px 0 5px;
  -webkit-app-region: no-drag;
  .icon {
    width: 35px;
    font-size: 13px;
    color: @text-color;
  }
  .unmaximize {
    transform: rotate(90deg);
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
