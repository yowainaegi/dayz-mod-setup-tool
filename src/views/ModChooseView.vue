<template>
  <div id="ModChoose" class="view-wrap">
    <div class="view-content">
      <a-row>
        <a-col :span="12">
          <div class="mode-list-title">{{ `${$t('ModChooseView.subscriptionTitle')}（${calculationModListNumber(MOD_LIST_TYPE.SUBSCRIBED)}）` }}</div>
          <div class="mode-list">
            <a-input-search v-model:value="modSubscribedKey" :placeholder="$t('ModChooseView.searchInputPlaceHolder')"
                            enter-button @search="searchModList(modSubscribedKey, MOD_LIST_TYPE.SUBSCRIBED)"/>
            <a-table
                :columns="columns"
                :data-source="filteredModListSubsribed"
                :scroll="{ y: tableHeight }"
                :pagination="false"
                :expand-row-by-click="true">
              <template #expandIcon="props">
                <transition name="icon_down_rotate">
                  <DownOutlined v-if="props.expanded" @click="props.onExpand(props.record)">
                  </DownOutlined>
                </transition>
                <transition name="icon_right_rotate">
                  <RightOutlined v-if="!props.expanded" @click="props.onExpand(props.record)">
                  </RightOutlined>
                </transition>
              </template>
              <template #bodyCell="{record, column}">
                <template v-if="column.key === 'action'">
                  <a-button type="primary" size="small" @click="addToInstalledList($event, record)">
                    <DoubleRightOutlined/>
                  </a-button>
                </template>
              </template>
              <template #expandedRowRender="{ record, expanded }">
                <p class="expand-content" v-if="expanded">
                  <div>
                    <a-row>
                      <a-col :span="12">
                        <img class="modPc" :src="record.StorageInfo.CachedPreviewImage.ImageJsonData" alt="">
                      </a-col>
                      <a-col :span="12">
                        <a-row>
                          <span>名称&nbsp;&nbsp;</span>
                          <span>{{ record.DisplayName }}</span>
                        </a-row>
                        <a-row>
                          <span>作者&nbsp;&nbsp;</span>
                          <span>{{ record.Author }}</span>
                        </a-row>
                      </a-col>
                    </a-row>
                  </div>
                </p>
              </template>
              <template #emptyText>
                {{ $t('ModChooseView.emptyText') }}
              </template>
            </a-table>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="mode-list-title">{{ `${$t('ModChooseView.additionalTitle')}（${calculationModListNumber(MOD_LIST_TYPE.ADDED)}）` }}</div>
          <div class="mode-list">
            <a-input-search
                v-model:value="modAddedKey"
                enter-button @search="searchModList(modAddedKey, MOD_LIST_TYPE.ADDED)"
                :placeholder="$t('ModChooseView.searchInputPlaceHolder')"
            />
            <a-table
                :columns="columns"
                :data-source="filteredModListAdded"
                :scroll="{ y: tableHeight }"
                :pagination="false"
                :expand-row-by-click="true">
              <template #expandIcon="props">
                <transition name="icon_down_rotate">
                  <DownOutlined v-if="props.expanded" @click="props.onExpand(props.record)">
                  </DownOutlined>
                </transition>
                <transition name="icon_right_rotate">
                  <RightOutlined v-if="!props.expanded" @click="props.onExpand(props.record)">
                  </RightOutlined>
                </transition>
              </template>
              <template #bodyCell="{record, column}">
                <template v-if="column.key === 'action'">
                  <a-button type="primary" size="small" @click="removeToSubscribedList($event, record)" :disabled="record.CanBeRemovedDZMSUTool === false">
                    <DoubleLeftOutlined/>
                  </a-button>
                </template>
              </template>
              <template #expandedRowRender="{ record, expanded }">
                <p class="expand-content" v-if="expanded">
                  <div>
                    <a-row>
                      <a-col :span="12">
                        <img class="modPc" :src="record.StorageInfo.CachedPreviewImage.ImageJsonData" alt="">
                      </a-col>
                      <a-col :span="12">
                        <a-row>
                          <span>名称&nbsp;&nbsp;</span>
                          <span>{{ record.DisplayName }}</span>
                        </a-row>
                        <a-row>
                          <span>作者&nbsp;&nbsp;</span>
                          <span>{{ record.Author }}</span>
                        </a-row>
                      </a-col>
                    </a-row>
                  </div>
                </p>
              </template>
              <template #emptyText>
                {{ $t('ModChooseView.emptyText') }}
              </template>
            </a-table>
          </div>
        </a-col>
      </a-row>
    </div>
    <div class="footer-content">
      <a-button @click="back" class="default-btn">{{ $t('ModChooseView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ operationMode === 'create'? $t('ModChooseView.createNext'):$t('ModChooseView.updateNext')  }}</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {i18n} from "@/i18n";
import {useStore} from "vuex";
import {RightOutlined, DownOutlined, DoubleRightOutlined, DoubleLeftOutlined} from "@ant-design/icons-vue";
import {useRouter} from "vue-router";
import {computed, Ref, ref, watch} from "vue";
import {getModList, getModIdListByServerConfigFile} from "@/server/api/ModChooseApi";
import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { deepClone } from "@/utils/Util";
import { MOD_BE_SEARCHE_STATUS, MOD_LIST_TYPE } from "@/server/models/Constant";
import { Modal } from "ant-design-vue";

const router = useRouter();
const store = useStore();

const operationMode = store.state.operationMode;

// winInfo store
const winInfo = computed(() => store.state.winInfo);

// 列表高度
let tableHeight = ref(calHeight(winInfo.value.screenHeight));

// 模组列表源数据
const modList_src: Ref<ModInfo[]> = ref([]);

// modList show src data
const modList_show: Ref<ModInfo[]> = ref([]);

// 服务器配置文件
const serverConfigFile:ServerConfigFile  = store.state.selectedConfigFile;

const columns = [
  {
    title: i18n.global.t('ModChooseView.tableTitle.name'),
    dataIndex: 'DisplayName',
    key: 'DisplayName',
  },
  {
    title: i18n.global.t('ModChooseView.tableTitle.action'),
    key: 'action',
    width: 90
  }
]

// 订阅MOD搜索关键词
let modSubscribedKey: Ref<string | null> = ref(null);
// 加入MOD搜索关键词
let modAddedKey: Ref<string | null> = ref(null);

// 更新标题
store.commit('updatePageTitle', i18n.global.t('ModChooseView.pageTitle'));

watch(winInfo, debounce((newValue: any, oldValue: any) => {
  tableHeight.value = calHeight(newValue.screenHeight);
      }, 50), // 300ms 延迟执行，你可以根据需要调整
      { deep: true } // 深度监听 winInfo 对象
)

/**
 * 计算table高度
 */
function calHeight(screenHeight: number): number {
  let otherHeightPercent = 0.3;
  if (screenHeight > 800 && screenHeight <= 1000) {
    otherHeightPercent = 0.25;
  } else if (screenHeight > 1000 && screenHeight <= 1300) {
    otherHeightPercent = 0.25;
  } else if (screenHeight > 1300) {
    otherHeightPercent = 0.2;
  }
  return screenHeight - (screenHeight * otherHeightPercent);
}

// 读取预设文件
getModList().then((res: ModInfo[]) => {
  res.forEach(item => {
    modList_src.value.push(item)
  })
  modList_show.value = deepClone(modList_src.value);
  sortByDisplayName(modList_show.value);

  // 根据配置文件id读取配置文件中的预设文件中的所有已经加入的modId
  if (serverConfigFile.preset_file_name) {
    getModIdListByServerConfigFile(serverConfigFile.preset_file_name).then((modAddedIdList: string[]) => {
      modList_show.value.forEach(item => {
        modAddedIdList.forEach(addedId => {
          if(item.Id === addedId) {
            item.AddedStatus = MOD_LIST_TYPE.ADDED;
            if(operationMode === 'update') {
              item.CanBeRemovedDZMSUTool = false;
            } else {
              item.CanBeRemovedDZMSUTool = true;
            }
          }
        })
      })
    })
  }
})

function searchModList(searchKey: string | null, modType: number) {
  if(searchKey) {
    modList_show.value.forEach((item: ModInfo) => {
      if (item.DisplayName.toUpperCase().indexOf(searchKey.toUpperCase()) > -1 && item.AddedStatus === modType) {
        item.SearchedStatus = MOD_BE_SEARCHE_STATUS.SEARCHED;
      } else if(item.AddedStatus === modType){
        item.SearchedStatus = MOD_BE_SEARCHE_STATUS.HIDDEN;
      }
    })
  } else {
    modList_show.value.forEach((item: ModInfo) => {
      if(item.AddedStatus === modType){
        item.SearchedStatus = MOD_BE_SEARCHE_STATUS.SEARCHED;
      }
    })
  }
}

// 过滤订阅列表
const filteredModListSubsribed = computed(() => {
  return modList_show.value.filter(item => item.AddedStatus === MOD_LIST_TYPE.SUBSCRIBED && item.SearchedStatus === MOD_BE_SEARCHE_STATUS.SEARCHED);
})

// 过滤安装列表
const filteredModListAdded = computed(() => {
  return modList_show.value.filter(item => item.AddedStatus === MOD_LIST_TYPE.ADDED && item.SearchedStatus === MOD_BE_SEARCHE_STATUS.SEARCHED);
})

/**
 * 将MOD加载到安装列表
 */
function addToInstalledList(event: Event, record: ModInfo) {
  event.stopPropagation();
  modList_show.value.forEach((item: ModInfo) => {
    if(item.Id === record.Id) {
      item.AddedStatus = MOD_LIST_TYPE.ADDED;
    }
  })
}

/**
 * 将MOD从安装列表中移除
 */
function removeToSubscribedList(event: Event, record: ModInfo) {
  event.stopPropagation();
  modList_show.value.forEach((item: ModInfo) => {
    if(item.Id === record.Id) {
      item.AddedStatus = MOD_LIST_TYPE.SUBSCRIBED;
    }
  })
}

/**
 * 计算列表中模组数量
 */
function calculationModListNumber(modType: number) {
  const resultList = modList_show.value.filter(item => item.AddedStatus === modType);
  return resultList.length;
}


function sortByDisplayName(list: ModInfo[]) {
  list.sort((a: ModInfo, b: ModInfo) => a.DisplayName.localeCompare(b.DisplayName))
}

// 自定义防抖函数
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  return (...args: Parameters<T>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}

/**
 * 返回
 */
function back() {
  router.push('/ConfigFileList');
}

function next() {
  const  modAddedList = modList_show.value.filter((item: ModInfo) => {
    return item.AddedStatus === MOD_LIST_TYPE.ADDED;
  });
  
  if(operationMode === 'create') {
    Modal.confirm({
      icon: '',
      title: i18n.global.t('ModChooseView.createConfirm'),
      okText: i18n.global.t('common.modal.confirm.yes'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
      centered: true,
      bodyStyle: {"text-align": "center"},
      onOk: () => {
        store.commit('updateModAddedList', modAddedList);
        router.push('/EditServer');    
      }
    })
  } else {

    let hasUpdateMod = false;
    for(let item of modAddedList) {
      if(item.CanBeRemovedDZMSUTool) {
        hasUpdateMod = true;
        break;
      }
    }
    if(!hasUpdateMod) {
      Modal.warning({
        title: i18n.global.t('ModChooseView.updateWarning'),
        centered: true,
        okText: i18n.global.t('common.modal.confirm.yes')
      })
    } else {
      Modal.confirm({
      icon: '',
      title: i18n.global.t('ModChooseView.updateConfirm'),
      okText: i18n.global.t('common.modal.confirm.yes'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
      centered: true,
      bodyStyle: {"text-align": "center"},
      onOk: () => {
        store.commit('updateModAddedList', modAddedList);
        router.push('/EditServer');    
      }
    })
    }
  }
}
</script>

<style scoped lang="less">
.mode-list-title {
  text-align: center;
}

.mode-list {
  padding: 0 20px 0 20px;
}

.icon_down_rotate-enter-active,
.icon_right_rotate-enter-active {
  transition: all 0.3s ease;
}

.icon_down_rotate-leave-active,
.icon_right_rotate-leave-active {
  display: none;
}

.icon_down_rotate-enter-from {
  transform: rotate(-90deg);
}

.icon_right_rotate-enter-from {
  transform: rotate(90deg);
}

.icon_down_rotate-enter-to,
.icon_right_rotate-enter-to {
  transform: rotate(0);
}


.row_expand-enter-active,
.row_expand-leave-active {
  transition: all 0.6s ease;
}

.row_expand-enter-from {
  height: 0;
}

.row_expand-leave-to {
  height: 0;
  display: none;
}

.row_expand-enter-to,
.row_expand-leave-from {
  height: 40px;
}

.modPc {
  width: 70%;
}
</style>