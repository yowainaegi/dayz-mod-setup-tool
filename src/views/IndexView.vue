<template>
  <div id="index" class="view-wrap">
    <div class="view-content index-content">
      <a-typography-title :level="1" class="title select-disabled">
        {{ $t('IndexView.title') }}
      </a-typography-title>
    </div>

    <FixedFooterActions>
      <router-link to="/SelectType">
        <a-button type="primary">Get Start!</a-button>
      </router-link>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import {useStore} from "vuex";
import {i18n} from "@/i18n";
import { onDeactivated } from "vue";
import FixedFooterActions from "@/components/common/FixedFooterActions/index.vue";

// store
const store = useStore();

// 初始化时
store.commit('updatePageTitle', i18n.global.t('IndexView.pageTitle'))

// 非激活时
onDeactivated(() => {
  store.commit('updatePageTitle', '')
})
</script>

<style scoped lang="less">
#index {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.index-content {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  text-align: center;
}

.title {
  margin-bottom: 0;
}
</style>
