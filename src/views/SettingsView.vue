<template>
  <div id="Settings" class="view-wrap">
    <div class="view-content">
      <a-divider orientation="left" class="divider">
        {{ $t('SettingsView.language.title') }}
      </a-divider>
      <a-dropdown>
        <template #overlay>
          <a-menu>
            <a-menu-item key="1" @click="changeLange('zh_CN')">
              {{ $t('SettingsView.language.zh_CN') }}
            </a-menu-item>
            <a-menu-item key="2" @click="changeLange('en_US')">
              {{ $t('SettingsView.language.en_US') }}
            </a-menu-item>
            <a-menu-item key="3" @click="changeLange('ja_JP')">
              {{ $t('SettingsView.language.ja_JP') }}
            </a-menu-item>
          </a-menu>
        </template>
        <a-button type="primary" size="middle" style="width: 90px;">
          {{ currentLangText }}
        </a-button>
      </a-dropdown>
      
      <a-divider orientation="left" class="divider">{{ $t('SettingsView.RelatedPaths.title') }}</a-divider>

      <a-form :model="reloatedPath"  :wrapper-col="{span: 24}">
        <a-form-item :label="$t('SettingsView.RelatedPaths.osUserName')">
          <label>{{ reloatedPath.osUserName.value }}</label>
        </a-form-item>

        <a-form-item :label="$t('SettingsView.RelatedPaths.dayZLauncherFolderPath')">
          <label>{{ reloatedPath.dayZLauncherFolderPath.value }}</label>
        </a-form-item>

        <a-form-item :label="$t('SettingsView.RelatedPaths.presetFileFolderPath')">
          <label>{{ reloatedPath.presetFileFolderPath.value }}</label>
        </a-form-item>
        <a-form-item :label="$t('SettingsView.RelatedPaths.pathCheck')">
          <label  v-if="checkPathStatus === 'success'">
            <CheckCircleTwoTone twoToneColor="#52c41a" />
            <span style="color: #52c41a;  margin-left: 5px">{{ $t('SettingsView.RelatedPaths.pathCheckSuccess') }}</span>
          </label>
          <label v-if="checkPathStatus === 'failed'" >
            <CloseCircleTwoTone twoToneColor="#f5222d" />
            <span style="color: #f5222d; margin-left: 5px">{{ $t('SettingsView.RelatedPaths.pathCheckFailed') }}</span>
          </label>
          <label v-if="checkPathStatus === 'checking'" >
            <LoadingOutlined/>
            <span style="margin-left: 5px">{{ $t('SettingsView.RelatedPaths.pathChecking') }}</span>
          </label>
          <a-button type="primary" size="small" style="float: right" @click="checkPath">
            {{ $t('SettingsView.RelatedPaths.recheck') }}
          </a-button>
        </a-form-item>
        <!-- <a-form-item :label="$t('SettingsView.RelatedPaths.workShopFolderPath')"  v-if="checkPathStatus === 'failed'">
          <a-input size="small"/>
        </a-form-item> -->
      </a-form>
    </div>

    <div class="footer-content">
      <a-button @click="quit" class="default-btn">{{ $t('SettingsView.back') }}</a-button>
      <a-button @click="apply" type="primary" :loading="applyLoading">{{ $t('SettingsView.apply') }}</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CheckCircleTwoTone, CloseCircleTwoTone, LoadingOutlined } from '@ant-design/icons-vue';
import { i18n } from "@/i18n";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { APP_LANGUAGE } from "@/constants/AppConfig";
import { getAppConfigByConfigName, updateAppConfigByConfigName } from "@/server/api/SettingsApi";
import { getWindowsUserName, getDayZLauncherDataFolderPath, getPresetFileFolderPath } from "@/server/api/SettingsApi";
import { Ref, ref } from 'vue';
import AppConfig from '@/server/models/AppConfig';

interface ReloatedPath {
  // 系统用户
  osUserName: Ref<string>,
  // 预设文件夹路径
  presetFileFolderPath: Ref<string>,
  // DayZ启动程序数据文件夹路径
  dayZLauncherFolderPath: Ref<string>
}

// router
const router = useRouter();
// store
const store = useStore();
// 当前语言
let currentLang: string;
// 当前语言文本
let currentLangText = ref('');
// 应用Loading
let applyLoading: boolean = false;
// 检查路径状态
let checkPathStatus: Ref<string> = ref('checking');
// 相关路径
let reloatedPath: ReloatedPath = {
  // 系统用户
  osUserName: ref(''),
  // 预设文件夹路径
  presetFileFolderPath: ref(''),
  // DayZ启动程序数据文件夹路径
  dayZLauncherFolderPath: ref('')
}

/**
 * 初始化
 */
 function init(): void {
  let lang: string;
  // 初始化语言
  getAppConfigByConfigName(APP_LANGUAGE).then((res: AppConfig) => {
    lang = res.config_value as string;
    changeLange(lang);
    store.commit('updatePageTitle', i18n.global.t('SettingsView.pageTitle'));
  }).then(() => {
    // 获取系统用户名
    getWindowsUserName().then((osUserName: string) => {
      reloatedPath.osUserName.value = osUserName;
    }).then(() => {
      // // 获取dayz启动器数据文件夹路径
      // getDayZLauncherDataFolderPath(reloatedPath.osUserName.value).then((dayZLauncherFolderPath: string) => {
      //   reloatedPath.dayZLauncherFolderPath.value = dayZLauncherFolderPath;
      // }).catch(() => {
      //   // 如果不能，需要手动指定文件夹路径
      //   checkPathStatus.value = 'failed';
      // });

      // // 获取预设文件夹路径
      // getPresetFileFolderPath(reloatedPath.osUserName.value).then((presetFileFolderPath: string) => {
      //   reloatedPath.presetFileFolderPath.value = presetFileFolderPath;
      // }).catch(() => {
      //   // 如果不能，需要手动指定文件夹路径
      //   checkPathStatus.value = 'failed';
      // })



      // 获取dayz启动器数据文件夹路径
      // 获取预设文件夹路径
      Promise.all([getDayZLauncherDataFolderPath(reloatedPath.osUserName.value), getPresetFileFolderPath(reloatedPath.osUserName.value)])
      .then((results) => {
        reloatedPath.dayZLauncherFolderPath.value = results[0];
        reloatedPath.presetFileFolderPath.value = results[1];
        // 如果都能正确获取上述路径，则路径检测成功
        checkPathStatus.value = 'success';
      })
      .catch((error) => {
        checkPathStatus.value = 'failed';
        throw error;
      });
    })
  })
};
// 执行初始化方法
init();

// 切换语言
function changeLange (lang: string): void {
  currentLang = lang;
  switch (lang) {
    case 'zh_CN':
      currentLangText.value = i18n.global.t('SettingsView.language.zh_CN');
      break;
    case 'en_US':
      currentLangText.value = i18n.global.t('SettingsView.language.en_US');
      break;
    case 'ja_JP':
      currentLangText.value = i18n.global.t('SettingsView.language.ja_JP');
      break;
    default:
      break;
  }
}

/**
 * 路径检查
 */
function checkPath(): void {
  init(); 
}

/**
 * 退出
 */
function quit(): void {
  let routerHistory = store.state.routerHistory;
  if(routerHistory.length === 0) {
    router.push('/');
  } else {
    router.push(routerHistory[routerHistory.length - 1]);
  }
}

/**
 * 应用
 */
function apply() {
  applyLoading = true;
  updateAppConfigByConfigName(APP_LANGUAGE, currentLang).then(() => {
    applyLoading = false;
    i18n.global.locale = currentLang as 'zh_CN' | 'en_US' | 'ja_JP';
    store.commit('updatePageTitle', i18n.global.t('SettingsView.pageTitle'));
  });
}
</script>

<style scoped lang="less">
@import '@/styles/themes/dark.less';

.divider {
  border-color: @primary-color;
}
</style>
