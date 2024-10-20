<template>
  <div id="LogList" class="view-wrap">
    <div class="view-content">
      <a-table :data-source="dataSource" :columns="columns" :pagination="false" :scroll="{y: 500}">
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'log_time'">
            {{ dateFormat(text, DateFormat.YYYY_MM_DD_HH_mm_ss) }}
          </template>
        </template>
        <template #emptyText>
          <p>{{ $t('LogListView.noData') }}</p>
        </template>
      </a-table>
    </div>
    <div class="footer-content">
      <a-button @click="back" class="default-btn">{{ $t('LogListView.back') }}</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useStore} from "vuex";
import {i18n} from "@/i18n";
import {getAppLogList} from "@/server/api/LogListApi";
import {dateFormat, DateFormat} from "@/utils/DateUtils";
import { Ref, ref } from "vue";
import { useRouter } from "vue-router";
import AppLog from "@/server/models/AppLog";

interface Column {
  title: string,
  dataIndex: string,
  key: string,
  width?: number
}

// 路由
const router = useRouter();
// 表格标题
let columns: Column[] = [
  {
    title: i18n.global.t('LogListView.logListTitle.logType'),
    dataIndex: 'log_type_text',
    key: 'log_type_text',
    width: 180
  },
  {
    title: i18n.global.t('LogListView.logListTitle.logContent'),
    dataIndex: 'log_content',
    key: 'log_content'
  },
  {
    title: i18n.global.t('LogListView.logListTitle.logTime'),
    dataIndex: 'log_time',
    key: 'log_time',
    width: 180
  }
]

// 表格数据
let dataSource: Ref<AppLog[]> = ref([]);

const store = useStore();
store.commit('updatePageTitle', i18n.global.t('LogListView.pageTitle'));

getAppLogList().then((res: AppLog[]) => {
  dataSource.value = res
})


// 返回
function back() {
  let routerHistory = store.state.routerHistory;
  if (routerHistory.length === 0) {
    router.push('/')
  } else {
    router.push(routerHistory[routerHistory.length - 1])
  }
}
</script>

<style scoped lang="less">
@import "@/styles/themes/dark.less";

.view-content {
  position: absolute;
  width: 100%;
  height: 100%;
}

.log-type-error {
  color: @error-color;
}

:deep(.ant-table-placeholder) {
  .ant-table-cell {
    color: @text-color;
    p {
     margin-bottom: 0; 
    }
  }
  .ant-table-cell:hover {
    background-color: @table-row-hover-bg;
  }
}
</style>
