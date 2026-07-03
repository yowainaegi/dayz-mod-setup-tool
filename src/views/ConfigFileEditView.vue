<template>
  <div id="ConfigFileEdit" class="view-wrap">
    <div class="view-content">
      <a-form :model="configFileForm" :label-col="{ span: formLabelSpan }" :rules="rules" @finish="save">
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
          <a-select v-model:value="configFileForm.preset_file_name" :options="presetFileNameList">
            <template #suffixIcon>
              <FluentIcon v-if="presetFileNameListLoading" name="spinner" color="white" spin />
              <FluentIcon v-else name="chevron-down" color="white" />
            </template>
          </a-select>
        </a-form-item>

        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverProfileFolder')" name="server_profile_folder">
          <a-input v-model:value="configFileForm.server_profile_folder" @blur="syncDerivedFields" />
        </a-form-item>

        <div class="footer-content">
          <a-button @click="back">{{ $t('ConfigFileEditView.back') }}</a-button>
          <a-button html-type="submit" type="primary">{{ $t('ConfigFileEditView.save') }}</a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import type { Rule } from 'ant-design-vue/es/form';
import { message, type SelectProps } from 'ant-design-vue';
import { i18n } from '@/i18n';
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import ConfigFile from '@/server/models/ServerConfigFile';
import { containsSpecialCharacters, pureServerFolderPathValidate, serverFolderPathValidate } from '@/server/validation/ConfigFileEditValidate';
import { addConfigFile, getConfigFileById, getPresetFileFolderPath, getPresetFileNameList, getWindowsUserName, updateConfigFile } from '@/server/api/ConfigFileEditApi';
import { getDateId } from '@/utils/Util';
import { getPathSep } from '@/utils/OsUtils';

const DEFAULT_PROFILE_FOLDER = 'profiles';

const router = useRouter();
const store = useStore();
const mode = store.state.configFileEditViewMode;
const formLabelSpan = ref(4);
const presetFileNameListLoading: Ref<boolean> = ref(false);
const presetFileNameList: Ref<SelectProps['options']> = ref([]);

const serverIdPK = mode === 'edit' ? Number(store.state.eidtConfigFileId) : null;
const serverIdDate = mode === 'create' ? getDateId() : null;

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
      validator: serverFolderPathValidate.bind(this),
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
  if (mode !== 'edit') {
    return;
  }

  if (configFileForm.value.id === null) {
    throw new Error('required param configFileForm.id');
  }

  configFileForm.value = await getConfigFileById(configFileForm.value.id);
  syncDerivedFields();
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

async function save(): Promise<void> {
  syncDerivedFields();

  if (mode === 'create') {
    await addConfigFile(configFileForm.value);
  } else if (mode === 'edit') {
    await updateConfigFile(configFileForm.value);
  }

  message.success(i18n.global.t('common.message.success.save'));
  router.push('/ConfigFileList');
}

init();
</script>
