<template>
  <div id="app">
    <TopNavBar :pageTitle="pageTitle"></TopNavBar>
    <!-- border-bottom: 1px solid @border-color-dark; -->
    <a-divider class="divider" style="height: 1px; margin: 0;"/>
    <a-config-provider :getPopupContainer="getPopupContainer">
      <router-view v-slot="{ Component }" ref="routerView">
        <transition :name="transitionName">
          <component class="component" :is="Component" />
        </transition>
      </router-view>
    </a-config-provider>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

const router  = useRouter();
const store = useStore();

let transitionName: string;

// 使用 computed 和 store.state.pageTitle 创建计算属性
const pageTitle = computed(() => store.state.pageTitle);


// 监听路由变化
watch(
  () => router.currentRoute.value,
  () => {
    transitionName = store.state.sideAnimation;
  }
)

const getPopupContainer = (el: any, dialogContext: any) => {
  if (dialogContext) {
    return dialogContext.getDialogWrap()
  } else {
    return document.body;
  }
}
</script>

<style scoped lang="less">
@import "@/styles/themes/dark.less";

.divider {
  background-color: @border-color-dark;
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



.slide_right-enter-from{
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
