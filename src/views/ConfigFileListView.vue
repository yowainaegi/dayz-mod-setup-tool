<template>
  <div id="ConfigFileList" class="view-wrap">
    <div class="view-content">
      <div style="margin-bottom: 16px">
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
              <a-col :span="19">
                <div class="configFIleInfo">
                  <a-row>
                    <a-col :span="8">{{ item.server_id }}</a-col>
                    <a-col :span="8">{{ item.config_file_name }}</a-col>
                    <a-col :span="8">{{ item.server_name }}</a-col>
                  </a-row>
                </div>
              </a-col>
              <a-col :span="4">2023-02-09 13:13:13</a-col>
            </a-row>

            <template #overlay v-if="operationMode === 'create'">
              <a-menu style="width: 100px; text-align: center">
                <a-menu-item key="1" @click="editConfigFile(item.id)">{{ $t('ConfigFileListView.dropDown.edit') }}</a-menu-item>
                <a-menu-item key="2" @click="deleteConfigFile(item.id)">{{ $t('ConfigFileListView.dropDown.delete') }}</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>

    <div class="footer-content">
      <a-button @click="back">{{ $t('ConfigFileListView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ $t('ConfigFileListView.next') }}</a-button>
    </div>
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
import { deepClone } from '@/utils/Util';
import { confirmNativeDialog, warningNativeDialog } from '@/utils/nativeDialog';

const configItemMouseOverIndex: Ref<number | null> = ref(null);
const configChooseIndex: Ref<number | null> = ref(null);
const searchValue: Ref<string> = ref('');
const configFileListShow: Ref<ConfigFile[]> = ref([]);
const configFileList: Ref<ConfigFile[]> = ref([]);
const store = useStore();
const router = useRouter();
const operationMode = store.state.operationMode;

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
  router.push('/ConfigFileEdit');
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
  if (configChooseIndex.value === null) {
    await warningNativeDialog({
      title: i18n.global.t('common.modal.warning.title'),
      message: i18n.global.t('ConfigFileListView.chooseConfigFileCheck'),
      okText: i18n.global.t('common.modal.confirm.yes'),
    });
    return;
  }

  configFileListShow.value.forEach((item, index) => {
    if (index === configChooseIndex.value) {
      store.commit('updateSelectedConfigFile', item);
    }
  });
  router.push('/ModChoose');
}

init();
</script>

<style scoped lang="less">
@import '@/styles/themes/dark.less';

.view-content {
  position: absolute;
  width: 100%;
  height: 100%;
}

.ConfigFileList {
  width: 100%;
  height: 78%;
  overflow-y: overlay;
}

.configFileItem:hover {
  cursor: pointer;
}

.configFileItem {
  height: 50px;
  line-height: 50px;
  margin: 5px;
  border: 1px solid #111111;
  box-shadow: 1px 1px 1px 1px rgba(0, 0, 0, 0.5);
}

.configItemChoose {
  background-color: @primary-color;
}

.configFIleInfo {
  width: 100%;
}

.configFilePicture {
  text-align: center;

  .fileIcon {
    font-size: 20px;
    line-height: 50px;
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
    box-shadow: 1px 1px 1px 1px rgba(0, 0, 0, 0.5);
  }

  to {
    box-shadow: 5px 5px 5px 1px rgba(0, 0, 0, 0.5);
    border-color: @primary-color;
  }
}

@keyframes configItemMouseLeaveAnim {
  from {
    box-shadow: 5px 5px 5px 1px rgba(0, 0, 0, 0.5);
    border-color: @primary-color;
  }

  to {
    box-shadow: 1px 1px 1px 1px rgba(0, 0, 0, 0.5);
  }
}

:deep(.ant-input-group-addon) {
  padding: 0;
  border: none;
  background-color: transparent;
}
</style>
