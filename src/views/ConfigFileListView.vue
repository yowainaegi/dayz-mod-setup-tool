<template>
  <div id="ConfigFileList" class="view-wrap">
    <div class="view-content config-file-list-content">
      <div class="config-file-toolbar">
        <div class="config-file-search">
          <a-input v-model:value="searchValue" size="middle" @keyup.enter="searchConfigFile" :placeholder="$t('ConfigFileListView.searchKey')">
            <template #addonBefore>
              <a-button size="middle" @click="createConfigFile">
                <template #icon>
                  <FluentIcon name="add" />
                </template>
              </a-button>
            </template>
            <template #addonAfter>
              <a-button size="middle" type="primary" @click="searchConfigFile">
                <template #icon>
                  <FluentIcon name="search" />
                </template>
              </a-button>
            </template>
          </a-input>
        </div>
        <a-button @click="mountXmlConfig">XML Mount</a-button>
      </div>

      <div class="ConfigFileList">
        <div
          v-for="(item, index) in configFileListShow"
          :key="item.id?.toString()"
          class="configFileItem"
          :class="{
            configFileItemMouseOver: configItemMouseOverIndex === index,
            configFileItemMouseLeave: configItemMouseOverIndex !== index,
            configItemChoose: configChooseIndex === index,
          }"
          @mouseover="configItemMouseOver(index)"
          @mouseleave="configItemMouseLeave"
          @click="chooseConfigFile(index)"
        >
          <a-dropdown :trigger="['contextmenu']">
            <a-row class="select-disabled">
              <a-col :span="1">
                <div class="configFilePicture">
                  <FluentIcon name="document" class="fileIcon" />
                </div>
              </a-col>
              <a-col :span="16">
                <div class="configFIleInfo">
                  <a-row>
                    <a-col :span="8">{{ item.server_id }}</a-col>
                    <a-col :span="8">{{ item.config_file_name }}</a-col>
                    <a-col :span="8">{{ item.server_name }}</a-col>
                  </a-row>
                </div>
              </a-col>
              <a-col :span="3">
                <span :class="['config-status', getConfigStatus(item)]">
                  {{ getConfigStatusLabel(item) }}
                </span>
              </a-col>
              <a-col :span="4">2023-02-09 13:13:13</a-col>
            </a-row>

            <template #overlay v-if="operationMode === 'create'">
              <a-menu style="width: 100px; text-align: center">
                <a-menu-item v-if="canEditConfigFile(item)" key="1" @click="editConfigFile(item.id)">{{ $t('ConfigFileListView.dropDown.edit') }}</a-menu-item>
                <a-menu-item key="2" @click="copyConfigFile(item.id)">{{ $t('ConfigFileListView.dropDown.copy') }}</a-menu-item>
                <a-menu-item key="3" @click="deleteConfigFile(item.id)">{{ $t('ConfigFileListView.dropDown.delete') }}</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>

    <FixedFooterActions>
      <a-button @click="back">{{ $t('ConfigFileListView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ $t('ConfigFileListView.next') }}</a-button>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import { message } from 'ant-design-vue';
import { ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { i18n } from '@/i18n';
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import ConfigFile from '@/server/models/ServerConfigFile';
import { getConfigFileList, removeConfigFileById } from '@/server/api/ConfigFileListApi';
import { updateConfigWorkspaceState } from '@/server/api/ConfigFileEditApi';
import { deepClone } from '@/utils/Util';
import { confirmNativeDialog, warningNativeDialog } from '@/utils/nativeDialog';
import ResData from '@/server/models/ResData';
import FixedFooterActions from '@/components/common/FixedFooterActions/index.vue';

const configItemMouseOverIndex: Ref<number | null> = ref(null);
const configChooseIndex: Ref<number | null> = ref(null);
const searchValue: Ref<string> = ref('');
const configFileListShow: Ref<ConfigFile[]> = ref([]);
const configFileList: Ref<ConfigFile[]> = ref([]);
const store = useStore();
const router = useRouter();
const operationMode = store.state.operationMode;
type ConfigStatus = NonNullable<ConfigFile['config_status']>;

function init(): void {
  store.commit('updatePageTitle', i18n.global.t('ConfigFileListView.pageTitle'));
  getList();
}

function getList(): void {
  getConfigFileList().then((res: ConfigFile[]) => {
    configFileList.value = res;
    configFileList.value.sort((a, b) => {
      if (b.id && a.id) {
        return b.id - a.id;
      }
      return -1;
    });
    configFileListShow.value = deepClone(configFileList.value);
  });
}

function searchConfigFile(): void {
  configChooseIndex.value = null;
  if (searchValue.value) {
    const param = searchValue.value.toUpperCase();
    configFileListShow.value = configFileList.value.filter(item => item.config_file_name?.toUpperCase().includes(param));
  } else {
    configFileListShow.value = deepClone(configFileList.value);
  }
}

function createConfigFile(): void {
  store.commit('updateConfigFileEditViewMode', 'create');
  store.commit('updateEditConfigFileId', null);
  store.commit('updateCopyConfigFileId', null);
  router.push('/ConfigFileEdit');
}

function chooseConfigFile(index: number): void {
  configChooseIndex.value = configChooseIndex.value === index ? null : index;
}

function configItemMouseOver(index: number): void {
  configItemMouseOverIndex.value = index;
}

function configItemMouseLeave(): void {
  configItemMouseOverIndex.value = null;
}

function editConfigFile(id: number | null): void {
  if (id === null) {
    throw new Error('required param id');
  }
  store.commit('updateConfigFileEditViewMode', 'edit');
  store.commit('updateEditConfigFileId', id);
  store.commit('updateCopyConfigFileId', null);
  router.push('/ConfigFileEdit');
}

function copyConfigFile(id: number | null): void {
  if (id === null) {
    throw new Error('required param id');
  }
  store.commit('updateConfigFileEditViewMode', 'create');
  store.commit('updateEditConfigFileId', null);
  store.commit('updateCopyConfigFileId', id);
  router.push('/ConfigFileEdit');
}

function getConfigStatus(configFile: ConfigFile): ConfigStatus {
  return configFile.config_status || 'draft';
}

function getConfigStatusLabel(configFile: ConfigFile): string {
  return i18n.global.t(`common.configStatus.${getConfigStatus(configFile)}`);
}

async function deleteConfigFile(id: number | null): Promise<void> {
  if (id === null) {
    throw new Error('required param id');
  }

  const confirmed = await confirmNativeDialog({
    title: i18n.global.t('common.modal.confirm.title'),
    message: i18n.global.t('ConfigFileListView.deleteConfirm'),
    confirmText: i18n.global.t('common.modal.confirm.yes'),
    cancelText: i18n.global.t('common.modal.confirm.cancel'),
  });

  if (!confirmed) {
    return;
  }

  const res = await removeConfigFileById(id);
  if (res) {
    getList();
    configChooseIndex.value = null;
    message.success(i18n.global.t('common.message.success.delete'));
  } else {
    message.error(i18n.global.t('common.message.failed.delete'));
  }
}

function back(): void {
  router.push('/SelectType');
}

async function next(): Promise<void> {
  const selectedConfigFile = await getSelectedConfigFile();
  if (!selectedConfigFile) {
    return;
  }

  if (!await validateWorkflowEntry(selectedConfigFile)) {
    return;
  }

  const workspaceReadyConfig = await prepareWorkspaceForConfig(selectedConfigFile);
  if (!workspaceReadyConfig) {
    return;
  }

  store.commit('updateSelectedConfigFile', workspaceReadyConfig);
  router.push('/ModChoose');
}

function hasCompletedServerWorkflow(configFile: ConfigFile): boolean {
  return configFile.config_status === 'server_created' || configFile.config_status === 'ce_mounted';
}

function canEditConfigFile(configFile: ConfigFile): boolean {
  return operationMode !== 'create' || !hasCompletedServerWorkflow(configFile);
}

async function validateWorkflowEntry(configFile: ConfigFile): Promise<boolean> {
  const currentOperationMode = store.state.operationMode;

  if (currentOperationMode === 'create' && hasCompletedServerWorkflow(configFile)) {
    const confirmed = await confirmNativeDialog({
      title: i18n.global.t('ConfigFileListView.workflowDialogs.enterUpdateTitle'),
      message: i18n.global.t('ConfigFileListView.workflowDialogs.enterUpdateMessage'),
      confirmText: i18n.global.t('ConfigFileListView.workflowDialogs.enterUpdateConfirm'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
    });
    if (confirmed) {
      store.commit('updateOperationMode', 'update');
    }
    return confirmed;
  }

  if (currentOperationMode === 'update' && !hasCompletedServerWorkflow(configFile)) {
    const confirmed = await confirmNativeDialog({
      title: i18n.global.t('ConfigFileListView.workflowDialogs.enterCreateTitle'),
      message: i18n.global.t('ConfigFileListView.workflowDialogs.enterCreateMessage'),
      confirmText: i18n.global.t('ConfigFileListView.workflowDialogs.enterCreateConfirm'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
    });
    if (confirmed) {
      store.commit('updateOperationMode', 'create');
    }
    return confirmed;
  }

  return true;
}

async function prepareWorkspaceForConfig(configFile: ConfigFile): Promise<ConfigFile | null> {
  if (!configFile.id || !configFile.server_folder_path) {
    await warningNativeDialog({
      title: i18n.global.t('common.modal.warning.title'),
      message: i18n.global.t('ConfigFileListView.workflowDialogs.missingWorkspaceMessage'),
      okText: i18n.global.t('common.modal.confirm.yes'),
    });
    return null;
  }

  if (!configFile.preset_file_name) {
    const res: ResData = await window.ipcRenderer.invoke(
      'serverAPI',
      'createGeneratedServerConfigWorkspace',
      configFile.server_folder_path
    );
    const nextConfig = {
      ...configFile,
      config_status: configFile.config_status && configFile.config_status !== 'draft'
        ? configFile.config_status
        : 'workspace_ready' as const,
      source_preset_file_path: null,
      active_preset_file_path: res.data.activePresetPath,
    };
    await updateConfigWorkspaceState(configFile.id, nextConfig.config_status, null, nextConfig.active_preset_file_path);
    return nextConfig;
  }

  let res: ResData = await window.ipcRenderer.invoke(
    'serverAPI',
    'prepareServerConfigWorkspace',
    configFile.server_folder_path,
    configFile.preset_file_name,
    false,
    configFile.source_preset_file_path
  );

  if (res.data?.requiresConfirmation) {
    const strongWarning = configFile.config_status === 'server_created' || configFile.config_status === 'ce_mounted';
    const confirmed = await confirmNativeDialog({
      title: i18n.global.t('ConfigFileListView.workflowDialogs.replacePresetTitle'),
      message: strongWarning
        ? i18n.global.t('ConfigFileListView.workflowDialogs.replacePresetCompletedMessage')
        : i18n.global.t('ConfigFileListView.workflowDialogs.replacePresetMessage'),
      confirmText: i18n.global.t('ConfigFileListView.workflowDialogs.replacePresetConfirm'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
    });

    if (!confirmed) {
      return null;
    }

    await window.ipcRenderer.invoke(
      'serverAPI',
      'markServerConfigWorkspacePresetSource',
      configFile.server_folder_path,
      configFile.preset_file_name
    );
  }

  const shouldResetToWorkspaceReady = !configFile.config_status
    || configFile.config_status === 'draft'
    || res.data?.sourceChanged;
  const nextConfig = {
    ...configFile,
    config_status: shouldResetToWorkspaceReady ? 'workspace_ready' as const : configFile.config_status,
    source_preset_file_path: configFile.preset_file_name,
    active_preset_file_path: res.data.activePresetPath,
    pending_preset_file_path: res.data?.sourceChanged ? configFile.preset_file_name : null,
  };
  await updateConfigWorkspaceState(configFile.id, nextConfig.config_status, nextConfig.source_preset_file_path, nextConfig.active_preset_file_path);
  return nextConfig;
}

async function mountXmlConfig(): Promise<void> {
  const selectedConfigFile = await getSelectedConfigFile();
  if (!selectedConfigFile) {
    return;
  }

  store.commit('updateSelectedConfigFile', selectedConfigFile);
  store.commit('updateToolCreatedFolderPathMap', new Map<string, string[]>());
  router.push('/ModMountConfig');
}

async function getSelectedConfigFile(): Promise<ConfigFile | null> {
  if (configChooseIndex.value === null) {
    await warningNativeDialog({
      title: i18n.global.t('common.modal.warning.title'),
      message: i18n.global.t('ConfigFileListView.chooseConfigFileCheck'),
      okText: i18n.global.t('common.modal.confirm.yes'),
    });
    return null;
  }

  return configFileListShow.value[configChooseIndex.value] || null;
}

init();
</script>

<style scoped lang="less">
#ConfigFileList {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-file-list-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 6px 10px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-file-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.config-file-search {
  flex: 1;
  min-width: 0;
}

.ConfigFileList {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
}

.configFileItem:hover {
  cursor: pointer;
}

.configFileItem {
  height: 42px;
  line-height: 42px;
  margin: 4px 0;
  border: 1px solid var(--app-color-bg-container);
  box-shadow: var(--app-shadow-elevated);
}

.configItemChoose {
  background-color: var(--app-color-primary);
}

.configFIleInfo {
  width: 100%;
}

.config-status {
  display: inline-flex;
  max-width: calc(100% - 8px);
  height: 20px;
  align-items: center;
  padding: 0 6px;
  overflow: hidden;
  border: 1px solid var(--app-color-border-secondary);
  background: var(--app-color-hover-bg);
  color: var(--app-color-text);
  font-size: 11px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.config-status.workspace_ready {
  border-color: var(--app-color-link);
  color: var(--app-color-link);
}

.config-status.server_created {
  border-color: var(--app-color-success);
  color: var(--app-color-success);
}

.config-status.ce_mounted {
  border-color: var(--app-color-primary);
  color: var(--app-color-primary);
}

.configFilePicture {
  text-align: center;

  .fileIcon {
    font-size: 18px;
    line-height: 42px;
  }
}

.configFileItemMouseOver {
  animation: configItemMouseOverAnim forwards 0.6s;
}

.configFileItemMouseLeave {
  animation: configItemMouseLeaveAnim forwards 0.3s;
}

@keyframes configItemMouseOverAnim {
  from {
    box-shadow: var(--app-shadow-elevated);
  }

  to {
    box-shadow: var(--app-shadow-elevated-strong);
    border-color: var(--app-color-primary);
  }
}

@keyframes configItemMouseLeaveAnim {
  from {
    box-shadow: var(--app-shadow-elevated-strong);
    border-color: var(--app-color-primary);
  }

  to {
    box-shadow: var(--app-shadow-elevated);
  }
}

:deep(.ant-input-group-addon) {
  padding: 0;
  border: none;
  background-color: transparent;
}
</style>
