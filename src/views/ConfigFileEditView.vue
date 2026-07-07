<template>
  <div id="ConfigFileEdit" class="view-wrap">
    <div class="view-content config-file-edit-content">
      <a-form class="config-file-edit-form" :model="configFileForm" :label-col="{ span: formLabelSpan }" :rules="rules" @finish="save">
        <div class="config-file-edit-fields">
        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverName')" name="server_name">
          <a-input v-model:value="configFileForm.server_name" @blur="syncDerivedFields" />
        </a-form-item>

        <a-form-item
          :label="$t('ConfigFileEditView.form.fields.pureServerFolderPath')"
          name="pure_server_folder_path"
          :validateFirst="true"
        >
          <a-input v-model:value="configFileForm.pure_server_folder_path" />
        </a-form-item>

        <a-form-item
          :label="$t('ConfigFileEditView.form.fields.serverFolderPath')"
          name="server_folder_path"
          :validateFirst="true"
        >
          <a-input v-model:value="configFileForm.server_folder_path" @blur="fillDefaultDeployPath" />
        </a-form-item>

        <a-form-item :label="$t('ConfigFileEditView.form.fields.deployServerFolderPath')" name="deploy_server_folder_path">
          <a-input v-model:value="configFileForm.deploy_server_folder_path" />
        </a-form-item>

        <a-form-item :label="$t('ConfigFileEditView.form.fields.presetFileName')" name="preset_file_name">
          <a-select v-model:value="configFileForm.preset_file_name" :options="presetFileNameList" allow-clear>
            <template #suffixIcon>
              <FluentIcon v-if="presetFileNameListLoading" name="spinner" color="var(--app-color-text-heading)" spin />
              <FluentIcon v-else name="chevron-down" color="var(--app-color-text-heading)" />
            </template>
          </a-select>
        </a-form-item>

        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverProfileFolder')" name="server_profile_folder">
          <a-input v-model:value="configFileForm.server_profile_folder" @blur="syncDerivedFields" />
        </a-form-item>

        <a-form-item :label="$t('ConfigFileEditView.modMountMode')" name="mod_mount_mode">
          <a-select v-model:value="configFileForm.mod_mount_mode" :options="modMountModeOptions" />
        </a-form-item>

        <a-form-item v-if="mode === 'edit'" :label="$t('ConfigFileEditView.status')">
          <div class="config-status-row">
            <span :class="['config-status-value', currentConfigStatus]">{{ currentConfigStatusLabel }}</span>
            <a-button @click="resetConfigStatus">{{ $t('ConfigFileEditView.resetStatus') }}</a-button>
          </div>
        </a-form-item>
        </div>

        <FixedFooterActions>
          <a-button @click="back">{{ $t('ConfigFileEditView.back') }}</a-button>
          <a-button html-type="submit" type="primary">{{ $t('ConfigFileEditView.save') }}</a-button>
        </FixedFooterActions>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import type { Rule } from 'ant-design-vue/es/form';
import { message, type SelectProps } from 'ant-design-vue';
import { i18n } from '@/i18n';
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import ConfigFile from '@/server/models/ServerConfigFile';
import { containsSpecialCharacters, pureServerFolderPathValidate } from '@/server/validation/ConfigFileEditValidate';
import { addConfigFile, getConfigFileById, getPresetFileFolderPath, getPresetFileNameList, getWindowsUserName, updateConfigFile, updateConfigStatus } from '@/server/api/ConfigFileEditApi';
import { getDateId } from '@/utils/Util';
import { getPathSep } from '@/utils/OsUtils';
import { MOD_MOUNT_MODE } from '@/services/modSetup/constants';
import FixedFooterActions from '@/components/common/FixedFooterActions/index.vue';

const DEFAULT_PROFILE_FOLDER = 'profiles';

const router = useRouter();
const store = useStore();
const mode = store.state.configFileEditViewMode;
const formLabelSpan = ref(4);
const presetFileNameListLoading: Ref<boolean> = ref(false);
const presetFileNameList: Ref<SelectProps['options']> = ref([]);
const originalServerFolderPath: Ref<string | null> = ref(null);
const modMountModeOptions: SelectProps['options'] = [
  {
    value: MOD_MOUNT_MODE.COPY,
    label: i18n.global.t('ConfigFileEditView.modMountModeOptions.copy'),
  },
  {
    value: MOD_MOUNT_MODE.JUNCTION,
    label: i18n.global.t('ConfigFileEditView.modMountModeOptions.junction'),
  },
];

const serverIdPK = mode === 'edit' ? Number(store.state.eidtConfigFileId) : null;
const serverIdDate = mode === 'create' ? getDateId() : null;
const copySourceConfigFileId = mode === 'create' && store.state.copyConfigFileId
  ? Number(store.state.copyConfigFileId)
  : null;
type ConfigStatus = NonNullable<ConfigFile['config_status']>;

const configFileForm = ref<ConfigFile>({
  id: serverIdPK,
  server_id: serverIdDate,
  server_name: null,
  config_file_name: null,
  pure_server_folder_path: null,
  server_folder_path: null,
  deploy_server_folder_path: null,
  preset_file_name: null,
  server_profile_folder: DEFAULT_PROFILE_FOLDER,
  server_map_mission_path: null,
  mod_mount_mode: MOD_MOUNT_MODE.COPY,
  config_status: 'draft',
  source_preset_file_path: null,
  active_preset_file_path: null,
});

const rules: Record<string, Rule[]> = {
  server_name: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.serverName'), trigger: 'blur' },
    {
      message: i18n.global.t('common.validates.containsSpecialCharacters'),
      validator: containsSpecialCharacters.bind(this),
      trigger: 'blur',
    },
  ],
  pure_server_folder_path: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.pureServerFolderPath'), trigger: 'blur' },
    {
      validator: pureServerFolderPathValidate.bind(this),
      message: i18n.global.t('ConfigFileEditView.form.validates.correctly.pureServerFolderPath'),
      trigger: 'blur',
    },
  ],
  server_folder_path: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.serverFolderPath'), trigger: 'blur' },
    {
      message: i18n.global.t('ConfigFileEditView.form.validates.correctly.serverFolderPath'),
      validator: validateServerFolderPath,
      trigger: 'blur',
    },
  ],
  deploy_server_folder_path: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.deployServerFolderPath'), trigger: 'blur' },
  ],
  server_profile_folder: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.serverProfileFolder'), trigger: 'blur' },
    {
      message: i18n.global.t('common.validates.containsSpecialCharacters'),
      validator: containsSpecialCharacters.bind(this),
      trigger: 'blur',
    },
  ],
};

const currentConfigStatus = computed<ConfigStatus>(() => configFileForm.value.config_status || 'draft');
const currentConfigStatusLabel = computed(() => i18n.global.t(`common.configStatus.${currentConfigStatus.value}`));

store.commit('updatePageTitle', i18n.global.t('ConfigFileEditView.pageTitle'));

function isPresetFileName(fileName: string): boolean {
  const normalizedFileName = fileName.toLowerCase();
  return normalizedFileName.endsWith('preset') || normalizedFileName.endsWith('preset2');
}

function syncDerivedFields(): void {
  if (configFileForm.value.server_name) {
    configFileForm.value.config_file_name = configFileForm.value.server_name;
  }

  fillDefaultDeployPath();

  if (!configFileForm.value.server_profile_folder) {
    configFileForm.value.server_profile_folder = DEFAULT_PROFILE_FOLDER;
  }
}

function fillDefaultDeployPath(): void {
  if (!configFileForm.value.deploy_server_folder_path && configFileForm.value.server_folder_path) {
    configFileForm.value.deploy_server_folder_path = configFileForm.value.server_folder_path;
  }
}

function normalizePath(path: string | null | undefined): string {
  return (path || '').replace(/\\/g, '/').replace(/\/+$/g, '').toLowerCase();
}

function canReuseExistingWorkspacePath(value: string): boolean {
  const status = configFileForm.value.config_status || 'draft';
  return mode === 'edit'
    && status !== 'draft'
    && normalizePath(value) === normalizePath(originalServerFolderPath.value);
}

async function validateServerFolderPath(_rule: Rule, value: string): Promise<void> {
  if (!value) {
    throw new Error('pathCleanValidate function path is required');
  }

  if (canReuseExistingWorkspacePath(value)) {
    await window.ipcRenderer.invoke('serverAPI', 'pathValidate', value);
    return;
  }

  const res = await window.ipcRenderer.invoke('serverAPI', 'pathCleanValidate', value);
  if (res.data === false) {
    throw new Error('the folder is not empty');
  }
}

async function loadPresetOptions(): Promise<void> {
  presetFileNameListLoading.value = true;
  try {
    const osUserName = await getWindowsUserName();
    const presetFileFolderPath = await getPresetFileFolderPath(osUserName);
    const fileNameList = await getPresetFileNameList(presetFileFolderPath);
    const pathSep = await getPathSep();

    presetFileNameList.value = [
      {
        value: null,
        label: i18n.global.t('common.selection.default'),
      },
      ...fileNameList
        .filter((item: { name: string }) => isPresetFileName(item.name))
        .map((item: { name: string }) => ({
          value: `${presetFileFolderPath}${pathSep}${item.name}`,
          label: item.name,
        })),
    ];
  } finally {
    presetFileNameListLoading.value = false;
  }
}

async function loadConfigFile(): Promise<void> {
  if (mode !== 'edit' && copySourceConfigFileId === null) {
    return;
  }

  if (mode === 'edit' && configFileForm.value.id === null) {
    throw new Error('required param configFileForm.id');
  }

  const loadedConfigFile = await getConfigFileById(mode === 'edit' ? configFileForm.value.id as number : copySourceConfigFileId as number);
  configFileForm.value = mode === 'edit' ? loadedConfigFile : buildCopiedConfigFile(loadedConfigFile);
  configFileForm.value.mod_mount_mode = configFileForm.value.mod_mount_mode || MOD_MOUNT_MODE.COPY;
  originalServerFolderPath.value = configFileForm.value.server_folder_path;
  syncDerivedFields();
}

function buildCopiedConfigFile(sourceConfigFile: ConfigFile): ConfigFile {
  return {
    ...sourceConfigFile,
    id: null,
    server_id: serverIdDate,
    config_status: 'draft',
    source_preset_file_path: sourceConfigFile.preset_file_name || null,
    active_preset_file_path: null,
    pending_preset_file_path: null,
  };
}

async function init(): Promise<void> {
  await Promise.all([
    loadPresetOptions(),
    loadConfigFile(),
  ]);
}

function back(): void {
  router.push('/ConfigFileList');
}

async function resetConfigStatus(): Promise<void> {
  if (mode !== 'edit' || configFileForm.value.id === null) {
    return;
  }

  await updateConfigStatus(configFileForm.value.id, 'draft');
  configFileForm.value.config_status = 'draft';
  message.success(i18n.global.t('ConfigFileEditView.statusResetSuccess'));
}

async function save(): Promise<void> {
  syncDerivedFields();
  configFileForm.value.preset_file_name = configFileForm.value.preset_file_name || null;
  configFileForm.value.source_preset_file_path = configFileForm.value.preset_file_name;
  configFileForm.value.config_status = configFileForm.value.config_status || 'draft';

  if (mode === 'create') {
    await addConfigFile(configFileForm.value);
    store.commit('updateCopyConfigFileId', null);
  } else if (mode === 'edit') {
    await updateConfigFile(configFileForm.value);
  }

  message.success(i18n.global.t('common.message.success.save'));
  router.push('/ConfigFileList');
}

init();
</script>

<style scoped lang="less">
#ConfigFileEdit {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-file-edit-content,
.config-file-edit-form {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-file-edit-fields {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.config-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.config-status-value {
  display: inline-flex;
  height: 20px;
  align-items: center;
  padding: 0 6px;
  border: 1px solid var(--app-color-border-secondary);
  background: var(--app-color-hover-bg);
  color: var(--app-color-text);
  font-size: 11px;
  line-height: 18px;
}

.config-status-value.workspace_ready {
  border-color: var(--app-color-link);
  color: var(--app-color-link);
}

.config-status-value.server_created {
  border-color: var(--app-color-success);
  color: var(--app-color-success);
}

.config-status-value.ce_mounted {
  border-color: var(--app-color-primary);
  color: var(--app-color-primary);
}
</style>
