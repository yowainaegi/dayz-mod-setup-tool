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

      <a-form :model="reloatedPath" :wrapper-col="{ span: 24 }">
        <a-form-item :label="$t('SettingsView.RelatedPaths.osUserName')">
          <label>{{ reloatedPath.osUserName.value }}</label>
        </a-form-item>

        <a-form-item :label="$t('SettingsView.RelatedPaths.dayZLauncherFolderPath')">
          <div class="path-value-row">
            <span class="path-text">{{ reloatedPath.dayZLauncherFolderPath.value }}</span>
            <span v-if="pathCheckStatus.dayZLauncher !== 'success'" class="path-expected-tip">{{ $t('SettingsView.RelatedPaths.expectedPath') }}</span>
            <PathStatus :status="pathCheckStatus.dayZLauncher" />
          </div>
        </a-form-item>

        <a-form-item :label="$t('SettingsView.RelatedPaths.presetFileFolderPath')">
          <div class="path-value-row">
            <span class="path-text">{{ reloatedPath.presetFileFolderPath.value }}</span>
            <span v-if="pathCheckStatus.preset !== 'success'" class="path-expected-tip">{{ $t('SettingsView.RelatedPaths.expectedPath') }}</span>
            <PathStatus :status="pathCheckStatus.preset" />
          </div>
        </a-form-item>

        <div class="path-check-actions">
          <a-button type="primary" size="small" :loading="isChecking" @click="checkPath">
            {{ $t(hasChecked ? 'SettingsView.RelatedPaths.recheck' : 'SettingsView.RelatedPaths.check') }}
          </a-button>
        </div>
      </a-form>
    </div>

    <FixedFooterActions>
      <a-button @click="quit">{{ $t('SettingsView.back') }}</a-button>
      <a-button @click="apply" type="primary" :loading="applyLoading">{{ $t('SettingsView.apply') }}</a-button>
    </FixedFooterActions>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, Ref, ref } from 'vue';
import { i18n } from '@/i18n';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { APP_LANGUAGE } from '@/constants/AppConfig';
import {
  buildDayZLauncherDataFolderPath,
  buildDisplayDayZLauncherDataFolderPath,
  buildDisplayPresetFileFolderPath,
  buildPresetFileFolderPath,
  checkDirectoryPath,
  getAppConfigByConfigName,
  getWindowsUserName,
  updateAppConfigByConfigName,
} from '@/server/api/SettingsApi';
import AppConfig from '@/server/models/AppConfig';
import FluentIcon from '@/components/common/FluentIcon/index.vue';
import FixedFooterActions from '@/components/common/FixedFooterActions/index.vue';

type PathCheckStatus = 'idle' | 'checking' | 'success' | 'failed';
type PathKey = 'dayZLauncher' | 'preset';

interface ReloatedPath {
  osUserName: Ref<string>,
  presetFileFolderPath: Ref<string>,
  dayZLauncherFolderPath: Ref<string>
}

const router = useRouter();
const store = useStore();
const currentLangText = ref('');
const pathCheckStatus = ref<Record<PathKey, PathCheckStatus>>({
  dayZLauncher: 'idle',
  preset: 'idle',
});
const reloatedPath: ReloatedPath = {
  osUserName: ref(''),
  presetFileFolderPath: ref(''),
  dayZLauncherFolderPath: ref('')
};
let currentLang = '';
let applyLoading = false;

const isChecking = computed(() => pathCheckStatus.value.dayZLauncher === 'checking' || pathCheckStatus.value.preset === 'checking');
const hasChecked = computed(() => pathCheckStatus.value.dayZLauncher !== 'idle' || pathCheckStatus.value.preset !== 'idle');

const PathStatus = defineComponent({
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (props.status === 'idle') {
        return null;
      }

      if (props.status === 'checking') {
        return h('span', { class: 'path-check-status' }, [
          h(FluentIcon, { name: 'spinner', spin: true }),
          h('span', i18n.global.t('SettingsView.RelatedPaths.pathChecking')),
        ]);
      }

      if (props.status === 'success') {
        return h('span', { class: 'path-check-status path-check-success' }, [
          h(FluentIcon, { name: 'checkmark-circle', color: 'var(--app-color-success)' }),
          h('span', i18n.global.t('SettingsView.RelatedPaths.pathCheckSuccess')),
        ]);
      }

      return h('span', { class: 'path-check-status path-check-failed' }, [
        h(FluentIcon, { name: 'dismiss-circle', color: 'var(--app-color-error)' }),
        h('span', i18n.global.t('SettingsView.RelatedPaths.pathCheckFailed')),
      ]);
    };
  },
});

function init(): void {
  getAppConfigByConfigName(APP_LANGUAGE).then((res: AppConfig) => {
    changeLange(res.config_value as string);
    store.commit('updatePageTitle', i18n.global.t('SettingsView.pageTitle'));
  });

  getWindowsUserName().then((osUserName: string) => {
    reloatedPath.osUserName.value = osUserName;
    loadExpectedPaths();
  });
}
init();

function loadExpectedPaths(): void {
  Promise.all([
    buildDisplayDayZLauncherDataFolderPath(),
    buildDisplayPresetFileFolderPath(),
  ]).then(([dayZLauncherPath, presetPath]) => {
    reloatedPath.dayZLauncherFolderPath.value = dayZLauncherPath;
    reloatedPath.presetFileFolderPath.value = presetPath;
  });
}

function changeLange(lang: string): void {
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

function checkPath(): void {
  pathCheckStatus.value.dayZLauncher = 'checking';
  pathCheckStatus.value.preset = 'checking';
  const osUserNamePromise = reloatedPath.osUserName.value
    ? Promise.resolve(reloatedPath.osUserName.value)
    : getWindowsUserName();

  osUserNamePromise.then((osUserName: string) => {
    reloatedPath.osUserName.value = osUserName;
    return Promise.all([
      checkExpectedPath('dayZLauncher', buildDayZLauncherDataFolderPath(osUserName)),
      checkExpectedPath('preset', buildPresetFileFolderPath(osUserName)),
    ]);
  }).catch(() => {
    if (pathCheckStatus.value.dayZLauncher === 'checking') {
      pathCheckStatus.value.dayZLauncher = 'failed';
    }
    if (pathCheckStatus.value.preset === 'checking') {
      pathCheckStatus.value.preset = 'failed';
    }
  });
}

async function checkExpectedPath(pathKey: PathKey, expectedPathPromise: Promise<string>): Promise<void> {
  const expectedPath = await expectedPathPromise;
  try {
    const realPath = await checkDirectoryPath(expectedPath);
    if (pathKey === 'dayZLauncher') {
      reloatedPath.dayZLauncherFolderPath.value = realPath;
    } else {
      reloatedPath.presetFileFolderPath.value = realPath;
    }
    pathCheckStatus.value[pathKey] = 'success';
  } catch {
    pathCheckStatus.value[pathKey] = 'failed';
  }
}

function quit(): void {
  const routerHistory = store.state.routerHistory;
  if (routerHistory.length === 0) {
    router.push('/');
  } else {
    router.push(routerHistory[routerHistory.length - 1]);
  }
}

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
#Settings {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.divider {
  border-color: var(--app-color-primary);
}

.path-value-row {
  display: flex;
  min-height: 24px;
  align-items: center;
  gap: 12px;
}

.path-value-row {
  min-width: 0;
}

.path-check-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
  margin-bottom: 16px;
}

.path-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path-expected-tip {
  flex: 0 0 auto;
  color: var(--app-color-text-tertiary);
  font-size: 12px;
}

.path-check-status {
  display: inline-flex;
  flex: 0 0 auto;
  min-width: 0;
  align-items: center;
  gap: 5px;
  line-height: 24px;
}

.path-check-status :deep(.fluent-icon) {
  flex: 0 0 auto;
  line-height: 1;
}

.path-check-success {
  color: var(--app-color-success);
}

.path-check-failed {
  color: var(--app-color-error);
}
</style>
