<template>
  <div id="ModChoose" class="view-wrap">
    <div class="view-content mod-choose-content">
      <a-row class="mod-choose-row" :gutter="16">
        <a-col :span="12">
          <div class="mode-list-title">{{ `${$t('ModChooseView.subscriptionTitle')}（${calculationModListNumber(MOD_LIST_TYPE.SUBSCRIBED)}）` }}</div>
          <div class="mode-list">
            <a-input-search v-model:value="modSubscribedKey" :placeholder="$t('ModChooseView.searchInputPlaceHolder')"
                            enter-button @search="searchModList(modSubscribedKey, MOD_LIST_TYPE.SUBSCRIBED)"/>
            <a-table
                :columns="columns"
                :data-source="filteredModListSubsribed"
                :scroll="tableScroll"
                :pagination="false"
                :expand-row-by-click="true">
              <template #expandIcon="props">
                <transition name="icon_down_rotate">
                  <FluentIcon v-if="props.expanded" name="chevron-down" @click="props.onExpand(props.record)" />
                </transition>
                <transition name="icon_right_rotate">
                  <FluentIcon v-if="!props.expanded" name="chevron-right" @click="props.onExpand(props.record)" />
                </transition>
              </template>
              <template #bodyCell="{record, column}">
                <template v-if="column.key === 'action'">
                  <a-button type="primary" size="small" @click="addToInstalledList($event, record)">
                    <FluentIcon name="arrow-right" />
                  </a-button>
                </template>
              </template>
              <template #expandedRowRender="{ record, expanded }">
                <p class="expand-content" v-if="expanded">
                  <div>
                    <a-row>
                      <a-col :span="12">
                        <img class="modPc" :src="record.previewImageMain" alt="">
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
                :columns="modAddedColumns"
                :data-source="filteredModListAdded"
                :scroll="tableScroll"
                :pagination="false"
                :expand-row-by-click="true">
              <template #expandIcon="props">
                <transition name="icon_down_rotate">
                  <FluentIcon v-if="props.expanded" name="chevron-down" @click="props.onExpand(props.record)" />
                </transition>
                <transition name="icon_right_rotate">
                  <FluentIcon v-if="!props.expanded" name="chevron-right" @click="props.onExpand(props.record)" />
                </transition>
              </template>
              <template #bodyCell="{record, column}">
                <template v-if="column.key === 'action'">
                  <a-button type="primary" size="small" @click="removeToSubscribedList($event, record)">
                    <FluentIcon name="arrow-left" />
                  </a-button>
                </template>
              </template>
              <template #expandedRowRender="{ record, expanded }">
                <p class="expand-content" v-if="expanded">
                  <div>
                    <a-row>
                      <a-col :span="12">
                        <img class="modPc" :src="record.previewImageMain" alt="">
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
    <FixedFooterActions>
      <a-button @click="back">{{ $t('ModChooseView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ primaryActionText }}</a-button>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import {i18n} from "@/i18n";
import {useStore} from "vuex";
import {useRouter} from "vue-router";
import {computed, Ref, ref} from "vue";
import {getModList, getModIdListByServerConfigFile, saveModIdListToPresetFile} from "@/server/api/ModChooseApi";
import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { deepClone } from "@/utils/Util";
import { MOD_BE_SEARCHE_STATUS, MOD_LIST_TYPE } from "@/server/models/Constant";
import FluentIcon from "@/components/common/FluentIcon/index.vue";
import { confirmNativeDialog, warningNativeDialog } from "@/utils/nativeDialog";
import FixedFooterActions from "@/components/common/FixedFooterActions/index.vue";
// import { getModPreviewImage } from "@/utils/OsUtils";


const router = useRouter();
const store = useStore();

const operationMode = store.state.operationMode;

// Table body uses flex height from the surrounding layout.
const tableScroll = { y: '100%' };

// 列表高度

// 模组列表源数据
const modList_src: Ref<ModInfo[]> = ref([]);

// modList show src data
const modList_show: Ref<ModInfo[]> = ref([]);

// 服务器配置文件
const serverConfigFile:ServerConfigFile  = store.state.selectedConfigFile;
const workingPresetFilePath = serverConfigFile.active_preset_file_path || serverConfigFile.preset_file_name;

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

const modAddedColumns = [
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

// 读取预设文件
getModList().then(async (res: ModInfo[]) => {
  res.forEach(item => {
    modList_src.value.push(item)
  })
  modList_show.value = deepClone(modList_src.value);
  sortByDisplayName(modList_show.value);

  // 根据配置文件id读取配置文件中的预设文件中的所有已经加入的modId
  if (workingPresetFilePath) {
    const modAddedIdList = await getModIdListByServerConfigFile(workingPresetFilePath);
    applyPresetModIds(modAddedIdList, operationMode === 'update');
  }

  if (operationMode === 'update' && serverConfigFile.pending_preset_file_path) {
    const nextPresetModIds = await getModIdListByServerConfigFile(serverConfigFile.pending_preset_file_path);
    applyPendingPresetModIds(nextPresetModIds);
  }
})

function applyPresetModIds(modIdList: string[], isExistingConfig: boolean): void {
  const modIdSet = new Set(modIdList.map((id) => normalizeModId(id)).filter((id): id is string => id !== null));
  modList_show.value.forEach(item => {
    const itemId = normalizeModId(item.Id);
    if(itemId && modIdSet.has(itemId)) {
      item.AddedStatus = MOD_LIST_TYPE.ADDED;
      item.CanBeRemovedDZMSUTool = true;
      item.IsAlreadyAddedToConfig = isExistingConfig;
      updateSearchStatusForCurrentList(item);
    }
  })
}

function applyPendingPresetModIds(modIdList: string[]): void {
  const modIdSet = new Set(modIdList.map((id) => normalizeModId(id)).filter((id): id is string => id !== null));
  modList_show.value.forEach(item => {
    const itemId = normalizeModId(item.Id);
    if (!itemId) {
      return;
    }

    item.AddedStatus = modIdSet.has(itemId) ? MOD_LIST_TYPE.ADDED : MOD_LIST_TYPE.SUBSCRIBED;
    if (modIdSet.has(itemId) && !item.IsAlreadyAddedToConfig) {
      item.CanBeRemovedDZMSUTool = true;
    }
    updateSearchStatusForCurrentList(item);
  })
}

function searchModList(searchKey: string | null, modType: number) {
  modList_show.value.forEach((item: ModInfo) => {
    if(item.AddedStatus === modType){
      updateSearchStatus(item, searchKey);
    }
  })
}

function getSearchKeyByModType(modType: number): string | null {
  return modType === MOD_LIST_TYPE.ADDED ? modAddedKey.value : modSubscribedKey.value;
}

function updateSearchStatus(item: ModInfo, searchKey: string | null): void {
  if (!searchKey || item.DisplayName.toUpperCase().indexOf(searchKey.toUpperCase()) > -1) {
    item.SearchedStatus = MOD_BE_SEARCHE_STATUS.SEARCHED;
    return;
  }

  item.SearchedStatus = MOD_BE_SEARCHE_STATUS.HIDDEN;
}

function updateSearchStatusForCurrentList(item: ModInfo): void {
  updateSearchStatus(item, getSearchKeyByModType(item.AddedStatus));
}

// 过滤订阅列表
const filteredModListSubsribed = computed(() => {
  return modList_show.value.filter(item => item.AddedStatus === MOD_LIST_TYPE.SUBSCRIBED && item.SearchedStatus === MOD_BE_SEARCHE_STATUS.SEARCHED);
})

// 过滤安装列表
const filteredModListAdded = computed(() => {
  return modList_show.value.filter(item => item.AddedStatus === MOD_LIST_TYPE.ADDED && item.SearchedStatus === MOD_BE_SEARCHE_STATUS.SEARCHED);
})

const hasUpdateModChanges = computed(() => {
  return operationMode === 'update' && (hasPendingModChanges(modList_show.value) || getRemovedMods().length > 0);
})

const primaryActionText = computed(() => {
  if (operationMode === 'create') {
    return i18n.global.t('ModChooseView.createNext');
  }

  return hasUpdateModChanges.value
    ? i18n.global.t('ModChooseView.updateNext')
    : i18n.global.t('ConfigFileListView.next');
})

/**
 * 将MOD加载到安装列表
 */
async function addToInstalledList(event: Event, record: ModInfo) {
  event.stopPropagation();
  const dependencyCheck = collectMissingDependencies(record);

  if (dependencyCheck.unavailableIds.length > 0) {
    await warningNativeDialog({
      title: i18n.global.t('common.modal.warning.title'),
      message: i18n.global.t('ModChooseView.dependencyMissingUnavailable', {
        modName: record.DisplayName,
        dependencies: dependencyCheck.unavailableIds.join(', '),
      }),
      okText: i18n.global.t('common.modal.confirm.yes'),
    });
    return;
  }

  if (dependencyCheck.availableMods.length > 0) {
    const confirmed = await confirmNativeDialog({
      title: i18n.global.t('ModChooseView.dependencyConfirmTitle'),
      message: i18n.global.t('ModChooseView.dependencyConfirmMessage', {
        modName: record.DisplayName,
        dependencies: dependencyCheck.availableMods.map((mod) => mod.DisplayName).join(', '),
      }),
      confirmText: i18n.global.t('common.modal.confirm.yes'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
    });
    if (!confirmed) {
      return;
    }
  }

  addModsToInstalledList([record, ...dependencyCheck.availableMods]);
}

/**
 * 将MOD从安装列表中移除
 */
async function removeToSubscribedList(event: Event, record: ModInfo) {
  event.stopPropagation();
  const dependentMods = getSelectedDependentMods(record);
  if (dependentMods.length > 0) {
    await warningNativeDialog({
      title: i18n.global.t('common.modal.warning.title'),
      message: i18n.global.t('ModChooseView.dependencyRemoveBlocked', {
        modName: record.DisplayName,
        dependents: dependentMods.map((mod) => mod.DisplayName).join(', '),
      }),
      okText: i18n.global.t('common.modal.confirm.yes'),
    });
    return;
  }

  if (operationMode === 'update' && record.IsAlreadyAddedToConfig) {
    const confirmed = await confirmNativeDialog({
      title: i18n.global.t('ModChooseView.removeExistingModConfirmTitle'),
      message: i18n.global.t('ModChooseView.removeExistingModConfirmMessage', {
        modName: formatRemoveConfirmModName(record.DisplayName),
      }),
      confirmText: i18n.global.t('common.modal.confirm.yes'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
    });
    if (!confirmed) {
      return;
    }
  }

  modList_show.value.forEach((item: ModInfo) => {
    if(item.Id === record.Id) {
      item.AddedStatus = MOD_LIST_TYPE.SUBSCRIBED;
      updateSearchStatusForCurrentList(item);
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

function hasPendingModChanges(modList: ModInfo[]): boolean {
  return modList.some((item: ModInfo) => {
    return item.AddedStatus === MOD_LIST_TYPE.ADDED && !item.IsAlreadyAddedToConfig;
  });
}

function normalizeModId(id: string | number | null | undefined): string | null {
  if (id === null || id === undefined) {
    return null;
  }

  const idText = String(id).trim();
  if (!idText) {
    return null;
  }

  return idText.startsWith('steam:') ? idText.substring('steam:'.length) : idText;
}

function formatDialogModName(name: string): string {
  const normalizedName = name.trim();
  if (normalizedName.length <= 72) {
    return `\n${normalizedName}\n`;
  }

  return `\n${normalizedName.substring(0, 69)}...\n`;
}

function formatInlineDialogModName(name: string): string {
  const normalizedName = name.trim();
  if (normalizedName.length <= 72) {
    return normalizedName;
  }

  return `${normalizedName.substring(0, 69)}...`;
}

function getCurrentLocale(): string {
  const locale = i18n.global.locale;
  return typeof locale === 'string' ? locale : locale.value;
}

function formatRemoveConfirmModName(name: string): string {
  return ['en_US', 'ja_JP', 'zh_CN'].includes(getCurrentLocale())
    ? formatInlineDialogModName(name)
    : formatDialogModName(name);
}

function getDependencyIds(mod: ModInfo): string[] {
  return Array.from(new Set((mod.SteamDependencies || [])
    .map((id) => normalizeModId(id))
    .filter((id): id is string => id !== null)));
}

function getModByNormalizedIdMap(): Map<string, ModInfo> {
  const modById = new Map<string, ModInfo>();
  modList_show.value.forEach((mod) => {
    const normalizedId = normalizeModId(mod.Id);
    if (normalizedId) {
      modById.set(normalizedId, mod);
    }
  });
  return modById;
}

function collectMissingDependencies(targetMod: ModInfo): { availableMods: ModInfo[]; unavailableIds: string[] } {
  const modById = getModByNormalizedIdMap();
  const selectedIds = new Set(
    modList_show.value
      .filter((mod) => mod.AddedStatus === MOD_LIST_TYPE.ADDED)
      .map((mod) => normalizeModId(mod.Id))
      .filter((id): id is string => id !== null)
  );
  const targetId = normalizeModId(targetMod.Id);
  if (targetId) {
    selectedIds.add(targetId);
  }

  const availableMods: ModInfo[] = [];
  const unavailableIds: string[] = [];
  const visitedIds = new Set<string>();

  function visit(mod: ModInfo): void {
    getDependencyIds(mod).forEach((dependencyId) => {
      if (visitedIds.has(dependencyId)) {
        return;
      }
      visitedIds.add(dependencyId);

      const dependencyMod = modById.get(dependencyId);
      if (!dependencyMod) {
        unavailableIds.push(dependencyId);
        return;
      }

      if (!selectedIds.has(dependencyId)) {
        selectedIds.add(dependencyId);
        availableMods.push(dependencyMod);
      }
      visit(dependencyMod);
    });
  }

  visit(targetMod);

  return {
    availableMods,
    unavailableIds: Array.from(new Set(unavailableIds)),
  };
}

function getDependencyClosureIds(mod: ModInfo, modById: Map<string, ModInfo>, visitedIds = new Set<string>()): Set<string> {
  getDependencyIds(mod).forEach((dependencyId) => {
    if (visitedIds.has(dependencyId)) {
      return;
    }
    visitedIds.add(dependencyId);

    const dependencyMod = modById.get(dependencyId);
    if (dependencyMod) {
      getDependencyClosureIds(dependencyMod, modById, visitedIds);
    }
  });

  return visitedIds;
}

function getSelectedDependentMods(targetMod: ModInfo): ModInfo[] {
  const targetId = normalizeModId(targetMod.Id);
  if (!targetId) {
    return [];
  }

  const modById = getModByNormalizedIdMap();
  return modList_show.value.filter((mod) => {
    return mod.Id !== targetMod.Id
      && mod.AddedStatus === MOD_LIST_TYPE.ADDED
      && getDependencyClosureIds(mod, modById).has(targetId);
  });
}

function addModsToInstalledList(mods: ModInfo[]): void {
  const idsToAdd = new Set(
    mods
      .map((mod) => normalizeModId(mod.Id))
      .filter((id): id is string => id !== null)
  );

  modList_show.value.forEach((item: ModInfo) => {
    const itemId = normalizeModId(item.Id);
    if(itemId && idsToAdd.has(itemId)) {
      item.AddedStatus = MOD_LIST_TYPE.ADDED;
      item.CanBeRemovedDZMSUTool = true;
      updateSearchStatusForCurrentList(item);
    }
  })
}

function getAddedMods(): ModInfo[] {
  return modList_show.value.filter((item: ModInfo) => {
    return item.AddedStatus === MOD_LIST_TYPE.ADDED;
  });
}

function getRemovedMods(): ModInfo[] {
  return modList_show.value.filter((item: ModInfo) => {
    return item.AddedStatus === MOD_LIST_TYPE.SUBSCRIBED && item.IsAlreadyAddedToConfig;
  });
}

async function ensureSelectedDependencies(): Promise<boolean> {
  const modsToAddById = new Map<string, ModInfo>();
  const unavailableIds = new Set<string>();

  getAddedMods().forEach((mod) => {
    const dependencyCheck = collectMissingDependencies(mod);
    dependencyCheck.availableMods.forEach((dependencyMod) => {
      const dependencyId = normalizeModId(dependencyMod.Id);
      if (dependencyId) {
        modsToAddById.set(dependencyId, dependencyMod);
      }
    });
    dependencyCheck.unavailableIds.forEach((dependencyId) => unavailableIds.add(dependencyId));
  });

  if (unavailableIds.size > 0) {
    await warningNativeDialog({
      title: i18n.global.t('common.modal.warning.title'),
      message: i18n.global.t('ModChooseView.dependencySelectionInvalid', {
        dependencies: Array.from(unavailableIds).join(', '),
      }),
      okText: i18n.global.t('common.modal.confirm.yes'),
    });
    return false;
  }

  const modsToAdd = Array.from(modsToAddById.values());
  if (modsToAdd.length === 0) {
    return true;
  }

  const confirmed = await confirmNativeDialog({
    title: i18n.global.t('ModChooseView.dependencyConfirmTitle'),
    message: i18n.global.t('ModChooseView.dependencySelectionConfirmMessage', {
      dependencies: modsToAdd.map((mod) => mod.DisplayName).join(', '),
    }),
    confirmText: i18n.global.t('common.modal.confirm.yes'),
    cancelText: i18n.global.t('common.modal.confirm.cancel'),
  });
  if (!confirmed) {
    return false;
  }

  addModsToInstalledList(modsToAdd);
  return true;
}

// function getModPreviewImageSync(expanded: any, record: ModInfo): void {
//   if(expanded) {

//     if(record.StorageInfo.CachedPreviewImage) {
//       for(let item of modList_show.value) {
//         if(record.Id === item.Id) {
//           item.previewImageMain = record.StorageInfo.CachedPreviewImage.ImageJsonData;    
//         }
//       }
//     } else {
//       getModPreviewImage(record.Url).then(res => {
//         for(let item of modList_show.value) {
//           if(record.Id === item.Id) {
//             item.previewImageMain = res;
//           }
//         }
//       })
//     }
//   }
// }

/**
 * 返回
 */
function back() {
  router.push('/ConfigFileList');
}

async function next() {
  if (!await ensureSelectedDependencies()) {
    return;
  }

  const persistWorkingPreset = async () => {
    if (workingPresetFilePath) {
      await saveModIdListToPresetFile(workingPresetFilePath, getAddedMods().map((item) => item.Id));
    }
  };
  if(operationMode === 'create') {
    const confirmed = await confirmNativeDialog({
      title: i18n.global.t('common.modal.confirm.title'),
      message: i18n.global.t('ModChooseView.createConfirm'),
      confirmText: i18n.global.t('common.modal.confirm.yes'),
      cancelText: i18n.global.t('common.modal.confirm.cancel'),
    })
    if (confirmed) {
      await persistWorkingPreset();
      store.commit('updateModAddedList', getAddedMods());
      store.commit('updateModRemovedList', []);
      router.push('/EditServer');
    }
  } else {

    if(!hasUpdateModChanges.value) {
      await persistWorkingPreset();
      store.commit('updateModAddedList', getAddedMods());
      store.commit('updateModRemovedList', getRemovedMods());
      store.commit('updateToolCreatedFolderPathMap', new Map<string, string[]>());
      router.push('/ModMountConfig');
    } else {
      const confirmed = await confirmNativeDialog({
        title: i18n.global.t('common.modal.confirm.title'),
        message: i18n.global.t('ModChooseView.updateConfirm'),
        confirmText: i18n.global.t('common.modal.confirm.yes'),
        cancelText: i18n.global.t('common.modal.confirm.cancel'),
      })
      if (confirmed) {
        await persistWorkingPreset();
        store.commit('updateModAddedList', getAddedMods());
        store.commit('updateModRemovedList', getRemovedMods());
        router.push('/EditServer');
      }
    }
  }
}
</script>

<style scoped lang="less">
#ModChoose {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mod-choose-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 6px 18px 0;
  overflow: hidden;
}

.mod-choose-row {
  height: 100%;
}

.mod-choose-row > :deep(.ant-col) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.mode-list-title {
  flex: 0 0 22px;
  text-align: center;
  height: 22px;
  line-height: 22px;
}

.mode-list {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mode-list :deep(.ant-input-search) {
  flex: 0 0 auto;
}

.mode-list :deep(.ant-table-wrapper) {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.mode-list :deep(.ant-spin-nested-loading),
.mode-list :deep(.ant-spin-container),
.mode-list :deep(.ant-table),
.mode-list :deep(.ant-table-container) {
  height: 100%;
  min-height: 0;
}

.mode-list :deep(.ant-spin-container),
.mode-list :deep(.ant-table),
.mode-list :deep(.ant-table-container) {
  display: flex;
  flex-direction: column;
}

.mode-list :deep(.ant-table-container) {
  flex: 1;
}

.mode-list :deep(.ant-table-header) {
  flex: 0 0 auto;
}

.mode-list :deep(.ant-table-body) {
  flex: 1;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto !important;
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
