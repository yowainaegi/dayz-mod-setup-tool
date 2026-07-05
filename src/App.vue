<template>
  <a-config-provider :getPopupContainer="getPopupContainer" :theme="antdTheme">
    <div id="app" :class="{ 'dialog-app': isDialogRoute }" :style="appThemeStyle">
      <TopNavBar v-if="!isDialogRoute" :pageTitle="pageTitle" />
      <div class="route-stage" :class="{ 'dialog-stage': isDialogRoute }">
        <router-view v-slot="{ Component, route }" ref="routerView">
          <transition :name="isDialogRoute ? undefined : transitionName">
            <div :key="route.fullPath" class="route-page">
              <component class="component" :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </div>
  </a-config-provider>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import TopNavBar from '@/components/global/TopNavBar/index.vue';
import { antdTheme, appThemeTokens } from '@/styles/antdTheme';

const router = useRouter();
const store = useStore();

const pageTitle = computed(() => store.state.pageTitle);
const isDialogRoute = computed(() => router.currentRoute.value.meta.dialog === true);
const transitionName = computed(() => store.state.sideAnimation);

const appThemeStyle = computed(() => ({
  '--app-color-text': appThemeTokens.colorText,
  '--app-color-text-heading': appThemeTokens.colorTextHeading,
  '--app-color-text-secondary': appThemeTokens.colorTextSecondary,
  '--app-color-primary': appThemeTokens.colorPrimary,
  '--app-color-primary-soft': appThemeTokens.colorPrimarySoft,
  '--app-color-link': appThemeTokens.colorLink,
  '--app-color-link-soft': appThemeTokens.colorLinkSoft,
  '--app-color-success': appThemeTokens.colorSuccess,
  '--app-color-success-soft': appThemeTokens.colorSuccessSoft,
  '--app-color-warning': appThemeTokens.colorWarning,
  '--app-color-warning-soft': appThemeTokens.colorWarningSoft,
  '--app-color-error-soft': appThemeTokens.colorErrorSoft,
  '--app-color-bg': appThemeTokens.colorBgBase,
  '--app-color-bg-content': appThemeTokens.colorBgContent,
  '--app-color-bg-container': appThemeTokens.colorBgContainer,
  '--app-color-bg-elevated': appThemeTokens.colorBgElevated,
  '--app-color-appbar-hover-bg': appThemeTokens.colorAppBarHoverBg,
  '--app-color-hover-bg': appThemeTokens.colorHoverBg,
  '--app-color-border': appThemeTokens.colorBorder,
  '--app-color-border-secondary': appThemeTokens.colorBorderSecondary,
  '--app-color-divider': appThemeTokens.colorDivider,
  '--app-color-error': appThemeTokens.colorError,
  '--app-border-radius': `${appThemeTokens.borderRadius}px`,
  '--app-shadow-elevated': appThemeTokens.boxShadowElevated,
  '--app-shadow-elevated-strong': appThemeTokens.boxShadowElevatedStrong,
  '--app-color-code-comment': appThemeTokens.colorCodeComment,
  '--app-color-code-keyword': appThemeTokens.colorCodeKeyword,
  '--app-color-code-muted': appThemeTokens.colorCodeMuted,
  '--app-color-code-tag': appThemeTokens.colorCodeTag,
  '--app-color-code-attribute': appThemeTokens.colorCodeAttribute,
  '--app-color-code-string': appThemeTokens.colorCodeString,
  '--app-titlebar-height': `${appThemeTokens.titleBarHeight}px`,
  color: appThemeTokens.colorText,
  backgroundColor: appThemeTokens.colorBgBase,
}));

const getPopupContainer = (_el: any, dialogContext: any) => {
  if (dialogContext) {
    return dialogContext.getDialogWrap();
  }
  return document.body;
};
</script>

<style scoped lang="less">
#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.dialog-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.route-stage {
  position: relative;
  width: 100vw;
  height: calc(100vh - var(--app-titlebar-height));
  overflow: hidden;
}

.dialog-stage {
  height: 100vh;
}

.route-page {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--app-color-bg-content);
}

.component {
  width: 100%;
  height: 100%;
}

.slide_right-enter-active,
.slide_right-leave-active,
.slide_left-enter-active,
.slide_left-leave-active {
  transition: transform 1s ease;
  will-change: transform;
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
