<template>
  <div id="SelectType" class="view-wrap">
    <div class="view-content select-type-content select-disabled">
      <a-typography-title :level="1">
        {{ $t('SelectTypeView.title') }}
      </a-typography-title>
    </div>

    <FixedFooterActions>
      <a-button @click="toUpdate">{{ $t('SelectTypeView.update') }}</a-button>
      <a-button type="primary" @click="toCreate">{{ $t('SelectTypeView.create') }}</a-button>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import {useStore} from "vuex";
import { useRouter } from "vue-router";
import {i18n} from "@/i18n";
import { onDeactivated } from "vue";
import FixedFooterActions from "@/components/common/FixedFooterActions/index.vue";

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

<style scoped lang="less">
#SelectType {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.select-type-content {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  text-align: center;
}

:deep(.ant-typography) {
  margin-bottom: 0;
}
</style>
