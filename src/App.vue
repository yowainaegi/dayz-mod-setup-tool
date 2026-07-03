<template>
  <a-config-provider :getPopupContainer="getPopupContainer" :theme="antdTheme">
    <div id="app" :class="{ 'dialog-app': isDialogRoute }" :style="appThemeStyle">
      <TopNavBar v-if="!isDialogRoute" :pageTitle="pageTitle" />
      <a-divider v-if="!isDialogRoute" class="divider" style="height: 1px; margin: 0;" />
      <router-view v-slot="{ Component }" ref="routerView">
        <transition :name="isDialogRoute ? undefined : transitionName">
          <component class="component" :is="Component" />
        </transition>
      </router-view>
    </div>
  </a-config-provider>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import TopNavBar from '@/components/global/TopNavBar/index.vue';
import { antdTheme, appThemeTokens } from '@/styles/antdTheme';

const router = useRouter();
const store = useStore();
let transitionName: string;

const pageTitle = computed(() => store.state.pageTitle);
const isDialogRoute = computed(() => router.currentRoute.value.meta.dialog === true);

const appThemeStyle = computed(() => ({
  '--app-color-text': appThemeTokens.colorText,
  '--app-color-text-heading': appThemeTokens.colorTextHeading,
  '--app-color-bg': appThemeTokens.colorBgBase,
  color: appThemeTokens.colorText,
  backgroundColor: appThemeTokens.colorBgBase,
}));

watch(
  () => router.currentRoute.value,
  () => {
    transitionName = store.state.sideAnimation;
  },
);

const getPopupContainer = (_el: any, dialogContext: any) => {
  if (dialogContext) {
    return dialogContext.getDialogWrap();
  }
  return document.body;
};
</script>

<style scoped lang="less">
@import "@/styles/themes/dark.less";

.divider {
  border-top-color: rgba(255, 255, 255, 0.14);
  background-color: transparent;
}

.dialog-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.slide_right-enter-active,
.slide_right-leave-active,
.slide_left-enter-active,
.slide_left-leave-active {
  transition: all 1s ease;
}

.slide_left-enter-from {
  transform: translateX(100%);
}

.slide_left-enter-to {
  transform: translateX(0);
}

.slide_left-leave-from {
  transform: translateX(0);
}

.slide_left-leave-to {
  transform: translateX(-100%);
}

.slide_right-enter-from {
  transform: translateX(-100%);
}

.slide_right-enter-to {
  transform: translateX(0);
}

.slide_right-leave-from {
  transform: translateX(0);
}

.slide_right-leave-to {
  transform: translateX(100%);
}
</style>
