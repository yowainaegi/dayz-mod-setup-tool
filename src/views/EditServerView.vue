<template>
  <div id="EditServer" class="view-wrap">
    <div class="view-content">
      <div>{{ processTitle }}</div>
      <a-progress :percent="percent" :show-info="false" />
      <div v-if="!isCounting && !isComplete">{{ $t('EditServerView.copyingContent', { percent, src: processSrcPath, dest: processTargetPath }) }} </div>
      <div v-if="isCounting && !isComplete">{{ $t('EditServerView.fileFound', { processFileCount } ) }}</div>
    </div>
    <div class="footer-content" v-if="showFoot">
      <a-button @click="back">{{ $t('EditServerView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ $t('EditServerView.next') }}</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { i18n } from "@/i18n";
import { ref, Ref } from "vue";
import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { globalErrorHandler } from "@/config/globalErrorHandler";
import useIpcListeners from "@/utils/useIpcListeners";
import { TASK_MODE } from "@/services/modSetup/constants";
import { runServerSetupWorkflow } from "@/services/modSetup/serverSetupWorkflow";
import { ServerSetupStageTitles, TaskMode } from "@/services/modSetup/types";

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

async function start() {
  receiveIpc('os-service-process-error', (errMsg: string) => {
    showFoot.value = true;
    globalErrorHandler(errMsg);
  });

  const result = await runServerSetupWorkflow({
    configFile: serverConfigFile,
    modList: modAddedList,
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
.view-content {
  width: 75%;
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
}
</style>
