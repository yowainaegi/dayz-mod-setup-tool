<template>
  <div id="index" class="view-wrap">
    <div class="view-content view-content-center">
      <h1 class="title select-disabled">
        {{ $t('IndexView.title') }}
      </h1>
      <div class="btn-area">
        <router-link to="/SelectType">
          <a-button type="primary">Get Start!</a-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useStore} from "vuex";
import {i18n} from "@/i18n";
import { onDeactivated } from "vue";

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
.btn-area {
  margin-top: 100px;
}

</style>
