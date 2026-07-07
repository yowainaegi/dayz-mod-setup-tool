<template>
  <div id="LogList" class="view-wrap">
    <div class="view-content">
      <a-table
        class="log-table"
        :data-source="dataSource"
        :columns="columns"
        :pagination="false"
        :scroll="{ y: '100%' }"
        :expandable="{ expandedRowRender: renderExpandedLog }"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'log_time'">
            {{ dateFormat(text, DateFormat.YYYY_MM_DD_HH_mm_ss) }}
          </template>
          <template v-if="column.dataIndex === 'log_content'">
            {{ formatLogSummary(text) }}
          </template>
        </template>
        <template #emptyText>
          <p>{{ $t('LogListView.noData') }}</p>
        </template>
      </a-table>
    </div>
    <FixedFooterActions>
      <a-button @click="back">{{ $t('LogListView.back') }}</a-button>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import {useStore} from "vuex";
import {i18n} from "@/i18n";
import {getAppLogList} from "@/server/api/LogListApi";
import {dateFormat, DateFormat} from "@/utils/DateUtils";
import { h, Ref, ref } from "vue";
import { useRouter } from "vue-router";
import AppLog from "@/server/models/AppLog";
import FixedFooterActions from "@/components/common/FixedFooterActions/index.vue";

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

function parseLogContent(logContent: string | null): any {
  if (!logContent) {
    return null;
  }

  try {
    return JSON.parse(logContent);
  } catch {
    return null;
  }
}

function formatLogSummary(logContent: string | null): string {
  const parsedLogContent = parseLogContent(logContent);
  return parsedLogContent?.message
      || parsedLogContent?.rawMessage
      || parsedLogContent?.dialogMessage
      || parsedLogContent?.userMessage
      || logContent
      || '';
}

function renderExpandedLog(record: AppLog) {
  return h('pre', { class: 'log-detail' }, record.log_content || '');
}


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
#LogList {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-table {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.log-table :deep(.ant-spin-nested-loading),
.log-table :deep(.ant-spin-container),
.log-table :deep(.ant-table),
.log-table :deep(.ant-table-container) {
  height: 100%;
  min-height: 0;
}

.log-table :deep(.ant-spin-container),
.log-table :deep(.ant-table),
.log-table :deep(.ant-table-container) {
  display: flex;
  flex-direction: column;
}

.log-table :deep(.ant-table-container) {
  flex: 1;
}

.log-table :deep(.ant-table-header) {
  flex: 0 0 auto;
}

.log-table :deep(.ant-table-body) {
  flex: 1;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto !important;
}

.log-type-error {
  color: var(--app-color-error);
}

.log-detail {
  max-height: 260px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--app-color-text);
}

:deep(.ant-table-placeholder) {
  .ant-table-cell {
    color: var(--app-color-text);
    p {
     margin-bottom: 0; 
    }
  }
  .ant-table-cell:hover {
    background-color: var(--app-color-hover-bg);
  }
}
</style>
