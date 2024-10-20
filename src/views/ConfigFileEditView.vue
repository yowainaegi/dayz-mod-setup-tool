<template>
  <div id="ConfigFileEdit" class="view-wrap">
    <div class="view-content">
      <a-form :model="configFileForm" :label-col="{ span: formLabelSpan }" :rules="rules" @finish="save">
        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverName')" name="server_name">
          <a-input v-model:value="configFileForm.server_name" />
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.configFileName')" name="config_file_name">
          <a-input v-model:value="configFileForm.config_file_name" />
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.pureServerFolderPath')" name="pure_server_folder_path"
          :validateFirst="true">
          <a-input v-model:value="configFileForm.pure_server_folder_path" />
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverFolderPath')" name="server_folder_path"
          :validateFirst="true">
          <a-input v-model:value="configFileForm.server_folder_path" @blur="autoCompleteDeploy()" />
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.deployServerFolderPath')"
          name="deploy_server_folder_path">
          <a-input v-model:value="configFileForm.deploy_server_folder_path" />
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.presetFileName')" name="preset_file_name">
          <a-select v-model:value="configFileForm.preset_file_name" :options="presetFileNameList">
            <template #suffixIcon>
              <down-outlined style="color: white" v-if="!presetFileNameListLoading"></down-outlined>
              <loading-outlined style="color: white" v-if="presetFileNameListLoading"></loading-outlined>
            </template>
          </a-select>
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverProfileFolder')" name="server_profile_folder">
          <a-input v-model:value="configFileForm.server_profile_folder"></a-input>
        </a-form-item>
        <a-form-item :label="$t('ConfigFileEditView.form.fields.serverId')">
          <label>{{ configFileForm.server_id }}</label>
        </a-form-item>
        <div class="footer-content">
          <a-button @click="back" class="default-btn">{{ $t('ConfigFileEditView.back') }}</a-button>
          <a-button html-type="submit" type="primary">{{ $t('ConfigFileEditView.save') }}</a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { i18n } from '@/i18n';
import { Ref, onMounted, onUnmounted, reactive, ref } from 'vue';
import { containsSpecialCharacters, pureServerFolderPathValidate, serverFolderPathValidate } from "@/server/validation/ConfigFileEditValidate";
import { getPathSep, getPresetFileFolderPath, getPresetFileNameList, getWindowsUserName } from '@/server/api/ConfigFileEditApi';
import type { Rule } from 'ant-design-vue/es/form';
import { SelectProps, message } from 'ant-design-vue';
import { addConfigFile, getConfigFileById, updateConfigFile } from '@/server/api/ConfigFileEditApi';
import { getDateId } from '@/utils/Util';
import ConfigFile from '@/server/models/ServerConfigFile';


// 路由
const router = useRouter();
// store
const store = useStore();
// 模式
const mode = store.state.configFileEditViewMode;
// 服务器ID（日期）
let serverIdDate: string | null = null;


// 服务器ID（主键）
let serverIdPK: number | null = null;
if(mode === 'edit') {
  serverIdPK = Number(store.state.eidtConfigFileId);
} else if(mode === 'create') {
  serverIdDate = getDateId();
}


// 配置文件表单
let configFileForm = ref(reactive<ConfigFile>({
  id: serverIdPK,
  server_id:  serverIdDate,
  server_name:  null,
  config_file_name:  null,
  pure_server_folder_path:  null,
  server_folder_path:  null,
  deploy_server_folder_path:  null,
  preset_file_name:  null,
  server_profile_folder:  null
}))

// 预设文件列表loading
let presetFileNameListLoading: Ref<boolean> = ref(false);
// 预设文件列表
let presetFileNameList: Ref<SelectProps[]> = ref([]);
// 表单验证规则
const rules: Record<string, Rule[]> = {
  server_name: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.serverName'), trigger: 'blur' },
    {
      message: i18n.global.t('common.validates.containsSpecialCharacters'),
      validator: containsSpecialCharacters.bind(this),
      trigger: 'blur'
    }
  ],
  config_file_name: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.configFileName'), trigger: 'blur' }
  ],
  pure_server_folder_path: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.pureServerFolderPath'), trigger: 'blur' },
    {
      validator: pureServerFolderPathValidate.bind(this),
      message: i18n.global.t('ConfigFileEditView.form.validates.correctly.pureServerFolderPath'),
      trigger: 'blur'
    }
  ],
  server_folder_path: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.serverFolderPath'), trigger: 'blur' },
    {
      message: i18n.global.t('ConfigFileEditView.form.validates.correctly.serverFolderPath'),
      validator: serverFolderPathValidate.bind(this),
      trigger: 'blur'
    }
  ],
  deploy_server_folder_path: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.deployServerFolderPath'), trigger: 'blur' },
  ],
  // preset_file_name: [
  //   { required: true, message: i18n.global.t('ConfigFileEditView.form.validates.required.presetFileName'), trigger: 'blur' },
  // ],
  server_profile_folder: [
    { required: true, type: 'string', message: i18n.global.t('ConfigFileEditView.form.validates.required.serverProfileFolder'), trigger: 'blur' },
    {
      message: i18n.global.t('common.validates.containsSpecialCharacters'),
      validator: containsSpecialCharacters.bind(this),
      trigger: 'blur'
    }
  ]
}

// 表单标题占比
let formLabelSpan = ref(4);
handleResize();

// 更新标题
store.commit('updatePageTitle', i18n.global.t('ConfigFileEditView.pageTitle'));

// 窗口大小重置后调用函数
function handleResize() {
  if(window.innerWidth < 1360) {
    formLabelSpan.value = 4
  }
  else if(window.innerWidth > 1360 && window.innerWidth < 1920) {
    formLabelSpan.value = 3
  } else if (window.innerWidth >= 1920) {
    formLabelSpan.value = 2
  }
}


// 在组件挂载时添加事件监听器
onMounted(() => {
  // 监听窗体变化
  window.addEventListener('resize', handleResize);
});

// 在组件卸载时移除事件监听器，防止内存泄漏
onUnmounted(() => {
  // 卸载监听窗体变化事件
  window.removeEventListener('resize', handleResize);
});



// 查询系统用户名，获取预设文件路径，获取预设文件列表，如果是更新，获取配置文件详细
presetFileNameListLoading.value = true;
getWindowsUserName()
  .then((osUserName: string) => getPresetFileFolderPath(osUserName))
  .then((presetFileFolderPath: string) => {
    // 将 presetFileFolderPath 传递给下一步
    return getPresetFileNameList(presetFileFolderPath)
      .then((fileNameList: any[]) => ({ presetFileFolderPath, fileNameList }));
  })
  .then(({presetFileFolderPath, fileNameList}) => {
    getPathSep().then((PATH_SEP: string) => {
      const res: any[] = [];
      const defaultSelectOption = {
        value: null,
        label: i18n.global.t('common.selection.default')
      }
      res.push(defaultSelectOption);
      fileNameList?.forEach((item: any) => {
        const selectOption = {
          value: `${presetFileFolderPath}${PATH_SEP}${item.name}`,
          label: item.name
        }
        res.push(selectOption);
      })
      presetFileNameList.value = res;
      presetFileNameListLoading.value = false;

      if(mode === 'edit') {
        if(configFileForm.value.id === null) {
        throw new Error('required param configFileForm.id');
      }
      return getConfigFileById(configFileForm.value.id)
        .then((res: ConfigFile) => {
          configFileForm.value = reactive(res);
        })
      }
    });
  })



// 返回
function back() {
  // this.clearFormDefaultVal()
  router.push('/ConfigFileList');
}

/**
 * 当验证成功后，保存
 */
function save() {
  // 根据mode判断编辑方式
  if (mode === 'create') {
    addConfigFile(configFileForm.value).then(res => {
      message.success(i18n.global.t('common.message.success.save'))
      router.push('/ConfigFileList')
    })
  } else if (mode === 'edit') {
    updateConfigFile(configFileForm.value).then(res => {
      message.success(i18n.global.t('common.message.success.save'))
      router.push('/ConfigFileList')
    })
  }
}

// 自动填充部署服务器文件夹路径
function autoCompleteDeploy() {
  if (!configFileForm.value.deploy_server_folder_path) {
    configFileForm.value.deploy_server_folder_path = configFileForm.value.server_folder_path;
  }
}
</script>

<style scoped>
.form-row {
  justify-content: space-around;
}

.form-col-left {
  margin-right: 10px;
}

.form-col-right {
  margin-left: 10px;
}
</style>