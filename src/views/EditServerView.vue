<template>
  <div id="EditServer" class="view-wrap">
    <div class="view-content">
      <div>{{ processTitle }}</div>
      <a-progress :percent="percent" :show-info="false" />
      <div v-if="!isCounting && !isComplete && showCopyingDetail && processSrcPath && processTargetPath">{{ $t('EditServerView.copyingContent', {
        percent, src: processSrcPath,
        dest: processTargetPath }) }} </div>
      <div v-if="!isCounting && !isComplete && !showCopyingDetail">Copying pure DayZ server files... {{ percent.toFixed(1) }}%</div>
      <div v-if="isCounting && !isComplete">{{ $t('EditServerView.fileFound', { processFileCount }) }}</div>
    </div>
    <FixedFooterActions v-if="showFoot">
      <a-button @click="back">{{ $t('EditServerView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ $t('EditServerView.next') }}</a-button>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { i18n } from "@/i18n";
import { computed, ref, Ref } from "vue";
import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { globalErrorHandler } from "@/config/globalErrorHandler";
import useIpcListeners from "@/utils/useIpcListeners";
import { TASK_MODE } from "@/services/modSetup/constants";
import { runServerSetupWorkflow } from "@/services/modSetup/serverSetupWorkflow";
import { ServerSetupStageTitles, TaskMode } from "@/services/modSetup/types";
import { updateConfigStatus } from "@/server/api/ConfigFileEditApi";
import FixedFooterActions from "@/components/common/FixedFooterActions/index.vue";

const router = useRouter();
const store = useStore();
const percent: Ref<number> = ref(0);
const processTitle: Ref<string | null> = ref(null);
const processSrcPath: Ref<string | null> = ref(null);
const processTargetPath: Ref<string | null> = ref(null);
const processFileCount: Ref<number> = ref(0);
const isCounting: Ref<boolean> = ref(false);
const isComplete: Ref<boolean> = ref(false);
const showFoot: Ref<boolean> = ref(false);
const { receiveIpc } = useIpcListeners();

const modAddedList: ModInfo[] = store.state.modAddedList;
const modRemovedList: ModInfo[] = store.state.modRemovedList || [];
const serverConfigFile: ServerConfigFile = store.state.selectedConfigFile;
const operationMode: TaskMode = store.state.operationMode === 'create' ? TASK_MODE.CREATE : TASK_MODE.UPDATE;
let toolCreatedFolderPathMap: Map<string, string[]> = new Map();

if (operationMode === TASK_MODE.CREATE) {
  store.commit('updatePageTitle', i18n.global.t('EditServerView.pageTitle.create'));
} else {
  store.commit('updatePageTitle', i18n.global.t('EditServerView.pageTitle.update'));
}

const stageTitles: ServerSetupStageTitles = {
  copyPureServer: i18n.global.t('EditServerView.stagesTitle.copy_pure_dayz_server_file_to_target_path'),
  copyKeys: i18n.global.t('EditServerView.stagesTitle.copy_keys_to_target_path'),
  copyMods: i18n.global.t('EditServerView.stagesTitle.copy_mods_to_target_path'),
  createProfile: i18n.global.t('EditServerView.stagesTitle.create_server_profile_folder'),
  editStartup: i18n.global.t('EditServerView.stagesTitle.edit_start_up_file'),
  editServerCfg: i18n.global.t('EditServerView.stagesTitle.edit_server_dz_cfg_file'),
  completed: i18n.global.t('EditServerView.stagesTitle.completed')
};

const showCopyingDetail = computed(() => {
  return processTitle.value !== stageTitles.copyPureServer;
});

async function start() {
  receiveIpc('os-service-process-error', (errMsg: string) => {
    showFoot.value = true;
    globalErrorHandler(errMsg);
  });

  const result = await runServerSetupWorkflow({
    configFile: serverConfigFile,
    modList: modAddedList,
    removedModList: modRemovedList,
    mode: operationMode,
    stageTitles,
    receiveIpc,
    onProgressChange: (progress) => {
      percent.value = progress;
    },
    onStageTitleChange: (stageTitle) => {
      processTitle.value = stageTitle;
    },
    onCopyingFileChange: (srcPath, targetPath) => {
      processSrcPath.value = srcPath;
      processTargetPath.value = targetPath;
    },
    onFileCountIncrement: (count) => {
      processFileCount.value += count;
    },
    onFileCountReset: () => {
      processFileCount.value = 0;
    },
    onCountingChange: (counting) => {
      isCounting.value = counting;
    }
  });

  toolCreatedFolderPathMap = result.createdFolderPathMap;
  if (serverConfigFile.id) {
    await updateConfigStatus(serverConfigFile.id, 'server_created');
    serverConfigFile.config_status = 'server_created';
  }
  isComplete.value = true;
}

start().finally(() => {
  showFoot.value = true;
});

function back() {
  router.push('/ModChoose');
}

function next() {
  store.commit('updateToolCreatedFolderPathMap', toolCreatedFolderPathMap);
  router.push('/ModMountConfig');
}
</script>

<style scoped lang="less">
#EditServer {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-content {
  flex: 1;
  min-height: 0;
  width: 75%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
}

:deep(.ant-progress) {
  max-width: 100%;
}
</style>
