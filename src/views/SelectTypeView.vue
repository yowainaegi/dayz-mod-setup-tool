<template>
  <div id="SelectType" class="view-wrap">
    <div class="view-content view-content-center select-disabled">
      <h1>{{ $t('SelectTypeView.title') }}</h1>
      <div class="btn-area">
        <a-button class="default-btn" @click="toUpdate">{{ $t('SelectTypeView.update') }}</a-button>
        <a-button type="primary" @click="toCreate">{{ $t('SelectTypeView.create') }}</a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useStore} from "vuex";
import { useRouter } from "vue-router";
import {i18n} from "@/i18n";
import { onDeactivated } from "vue";

// store
const store = useStore(); 
// router
const router = useRouter();

// 更新页面标题
store.commit('updatePageTitle', i18n.global.t('SelectTypeView.pageTitle'))

// 创建
function toCreate() {
  router.push('/ConfigFileList');
  store.commit('updateOperationMode', 'create');
}

// 更新
function toUpdate() {
  router.push('/ConfigFileList');
  store.commit('updateOperationMode', 'update');
}

// 非激活时
onDeactivated(() => {
  store.commit('updatePageTitle', '');
})
</script>

<style scoped>
.btn-area {
  margin-top: 100px;
  width: 100%;
  display: flex;
  justify-content: space-around;
}
</style>