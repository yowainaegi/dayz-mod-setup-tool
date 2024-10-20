<template>
  <div id="ConfigFileList" class="view-wrap">
    <div class="view-content">
      <div style="margin-bottom: 16px">
        <a-input v-model:value="searchValue" size="middle" @keyup.enter="searchConfigFile()" :placeholder="$t('ConfigFileListView.searchKey')">
          <template #addonBefore>
            <a-button size="middle" class="default-btn" @click="createConfigFile">
              <template #icon>
                <PlusOutlined />
              </template>
            </a-button>
          </template>
          <template #addonAfter>
            <a-button size="middle" type="primary" @click="searchConfigFile()">
              <template #icon>
                <SearchOutlined />
              </template>
            </a-button>
          </template>
        </a-input>
      </div>
      <div class="ConfigFileList">
        <div class="configFileItem" v-for="(item,index) in configFileListShow" :key="item.id?.toString()"
             :class="{configFileItemMouseOver: configItemMouseOverIndex === index,
             configFileItemMouseLeave: configItemMouseOverIndex !== index,
             configItemChoose: configChooseIndex === index}"
             @mouseover="configItemMouseOver(index)"
             @mouseleave="configItemMouseLeave"
             @click="chooseConfigFile(index)"
        >
          <a-dropdown :trigger="['contextmenu']">
            <a-row class="select-disabled">
              <a-col :span="1">
                <div class="configFilePicture">
                  <FileTextOutlined class="fileIcon"/>
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
              <a-col :span="4">
                2023-02-09 13:13:13
              </a-col>
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
      <a-button @click="back" class="default-btn">{{ $t('ConfigFileListView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ $t('ConfigFileListView.next') }}</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { i18n } from "@/i18n"
import { message, Modal } from "ant-design-vue";
import { useStore } from "vuex";
import { getConfigFileList, removeConfigFileById } from "@/server/api/ConfigFileListApi";
import { deepClone } from "@/utils/Util";
import { Ref, ref } from "vue";
import { useRouter } from "vue-router";
import ConfigFile from "@/server/models/ServerConfigFile";
import { FileTextOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons-vue';

// 鼠标悬浮item的下标
let configItemMouseOverIndex: Ref<number | null> = ref(null);

let configChooseIndex: Ref<number | null> = ref(null);
let searchValue: Ref<string> = ref('');
let configFileListShow: Ref<ConfigFile[]> = ref([]);
let configFileList: Ref<ConfigFile[]> = ref([]);
const store = useStore();
const router = useRouter();
const operationMode = store.state.operationMode;


/**
 * 初始化
 */
function init() {
  // 设置标题
  store.commit('updatePageTitle', i18n.global.t('ConfigFileListView.pageTitle'));
  getList();
}

init();

/**
 * 获取配置文件列表
 */
function getList(): void {
  // 获取配置文件
  getConfigFileList().then((res: ConfigFile[]) => {
    configFileList.value = res;
    // 深拷贝
    configFileListShow.value = deepClone(configFileList.value);
  })
}


/**
 * 搜索配置文件
 */
function searchConfigFile(): void {
  // 重置选择配置文件
  configChooseIndex.value = null;
  if(searchValue.value !== null && searchValue.value !== '') {
    let param = searchValue.value
    configFileListShow.value = configFileList.value.filter(item => item.config_file_name?.toUpperCase().indexOf(param.toUpperCase()) !== -1)
  } else {
    configFileListShow.value = deepClone(configFileList.value);
  }
}

/**
 * 创建配置文件，跳转至创建页面
 */
function createConfigFile(): void {
  store.commit('updateConfigFileEditViewMode', 'create');
  router.push('/ConfigFileEdit')
}

/**
 * 选择配置文件
 */
function chooseConfigFile(index: number): void {
  configChooseIndex.value = configChooseIndex.value === index ? null : index
}

/**
 * 配置文件鼠标进入
 */
function configItemMouseOver(index: number): void {
  configItemMouseOverIndex.value = index;
}

/**
 * 配置文件鼠标离开
 */
function configItemMouseLeave(): void {
  configItemMouseOverIndex.value = null;
}

// 编辑配置文件
function editConfigFile(id: number | null): void {
  if(id === null) {
    throw new Error('required param id');
  }
  store.commit('updateConfigFileEditViewMode', 'edit');
  store.commit('updateEditConfigFileId', id);
  router.push('/ConfigFileEdit');
}

/**
 * 删除配置文件
 */
function deleteConfigFile(id: number | null) {
  if(id === null) {
    throw new Error('required param id');
  }
  Modal.confirm({
    title: i18n.global.t('ConfigFileListView.deleteConfirm'),
    icon: '',
    okText: i18n.global.t('common.modal.confirm.yes'),
    cancelText: i18n.global.t('common.modal.confirm.cancel'),
    centered: true,
    bodyStyle: {"text-align": "center"},
    onOk() {
      removeConfigFileById(id).then((res: boolean) => {
        if(res) {
          // 重新获取列表
          getList();
          // 重置选择下标
          configChooseIndex.value = null
          message.success(i18n.global.t('common.message.success.delete'))
        } else {
          message.error(i18n.global.t('common.message.failed.delete'))
        }
      })
    },
    onCancel() {
    },
  });
}

/**
 * 返回
 */
function back() {
  router.push('/SelectType');
}

/**
 * 下一步
 */
function next() {
  if(configChooseIndex.value === null) {
    Modal.warning({
      title: i18n.global.t('ConfigFileListView.chooseConfigFileCheck'),
      centered: true,
      okText: i18n.global.t('common.modal.confirm.yes')
    })
  } else {
    configFileListShow.value.forEach((item, index) => {
      if(index === configChooseIndex.value) {
        store.commit('updateSelectedConfigFile', item);
      }
    })
    router.push('/ModChoose')
  }
}
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
  box-shadow: 1px 1px 1px 1px rgba(0,0,0,0.5);
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
  animation: configItemMouseOverAnim forwards .6s;
}

.configFileItemMouseLeave {
  animation: configItemMouseLeaveAnim forwards .3s;
}

@keyframes configItemMouseOverAnim {
  from {
    box-shadow: 1px 1px 1px 1px rgba(0,0,0,0.5);
  }
  to {
    box-shadow: 5px 5px 5px 1px rgba(0,0,0,0.5);
    border-color: @primary-color;
  }
}

@keyframes configItemMouseLeaveAnim {
  from {
    box-shadow: 5px 5px 5px 1px rgba(0,0,0,0.5);
    border-color: @primary-color;
  }
  to {
    box-shadow: 1px 1px 1px 1px rgba(0,0,0,0.5);
  }
}

:deep(.ant-input-group-addon) {
  padding: 0;
  border: none;
  background-color: transparent;
}

</style>
