<template>
    <div id="ModMountConfig" class="view-wrap">
        <div class="view-content">
            <h2>{{ $t('ModMountConfigView.mainContent.normalText1') }}</h2>
            <h2><span class="important-text">{{ $t('ModMountConfigView.mainContent.importantText') }}</span></h2>
            <h2>{{ $t('ModMountConfigView.mainContent.normalText2') }}</h2>
            <h3>{{ $t('ModMountConfigView.mainContent.attention') }}</h3>

            <div class="process-bar-area">
                <div>{{ processTitle }}</div>
                <a-progress :percent="percent" :show-info="false" />
                <div v-if="!isCounting && !isComplete">{{ $t('ModMountConfigView.copyingContent', {percent, src:processSrcPath, dest: processTargetPath }) }} </div>
                <div v-if="isCounting && !isComplete && !isFooterShow">{{ $t('ModMountConfigView.fileFound', { processFileCount }) }}</div>
            </div>
        </div>
        <div class="footer-content" v-if="isFooterShow">
            <a-button @click="back">{{ $t('ModMountConfigView.back') }}</a-button>
            <a-button @click="next" type="primary" v-if="!isComplete">{{ $t('ModMountConfigView.next') }}</a-button>
            <a-button @click="completedNext" type="primary" v-if="isComplete">{{ $t('ModMountConfigView.completedNext') }}</a-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { i18n } from '@/i18n';
import { ref, Ref } from 'vue';
import ServerConfigFile from '@/server/models/ServerConfigFile';
import { globalErrorHandler } from '@/config/globalErrorHandler';
import useIpcListeners from '@/utils/useIpcListeners';
import { runModMountWorkflow } from '@/services/modSetup/modMountWorkflow';
import { ModMountStageTitles } from '@/services/modSetup/types';

const store = useStore();
const router = useRouter();

store.commit('updatePageTitle', i18n.global.t('ModMountConfigView.pageTitle'));

const serverConfigFile: ServerConfigFile = store.state.selectedConfigFile;
const toolCreatedFolderPathMap: Map<string, string[]> = store.state.toolCreatedFolderPathMap;

const percent: Ref<number> = ref(0);
const processFileCount: Ref<number> = ref(0);
const processSrcPath: Ref<string | null> = ref(null);
const processTargetPath: Ref<string | null> = ref(null);
const processTitle: Ref<string> = ref('');
const isCounting: Ref<boolean> = ref(true);
const isComplete: Ref<boolean> = ref(false);
const isFooterShow: Ref<boolean> = ref(true);
const { receiveIpc, clearIpcListeners } = useIpcListeners();

const stageTitles: ModMountStageTitles = {
    copyMissions: i18n.global.t('ModMountConfigView.stagesTitle.copy_missions_file_to_target_path'),
    copyModConfigXml: i18n.global.t('ModMountConfigView.stagesTitle.copy_mod_config_xml_to_target_path'),
    completed: i18n.global.t('ModMountConfigView.stagesTitle.completed')
};

async function start() {
    clearIpcListeners();

    receiveIpc('os-service-process-error', (errMsg: string) => {
        isFooterShow.value = true;
        globalErrorHandler(errMsg);
    });

    await runModMountWorkflow({
        configFile: serverConfigFile,
        createdFolderPathMap: toolCreatedFolderPathMap,
        stageTitles,
        receiveIpc,
        onProgressChange: (progress) => {
            percent.value = progress;
        },
        onStageTitleChange: (stageTitle) => {
            processTitle.value = stageTitle;
        },
        onCopyingFileChange: (srcPath, targetPath) => {
            processSrcPath.value = srcPath;
            processTargetPath.value = targetPath;
        },
        onFileCountIncrement: (count) => {
            processFileCount.value += count;
        },
        onFileCountReset: () => {
            processFileCount.value = 0;
        },
        onCountingChange: (counting) => {
            isCounting.value = counting;
        }
    });

    isComplete.value = true;
}

function back() {
    router.push('/ModChoose');
}

function next() {
    isFooterShow.value = false;
    start().finally(() => {
        isFooterShow.value = true;
    });
}

function completedNext() {
    router.push('/SelectType');
}
</script>

<style lang="less" scoped>
@import '@/styles/themes/dark.less';

.important-text {
    background-color: @primary-color;
}

.view-content {
    width: 100%;
    text-align: center;
    position: absolute;
    top: 30%;
    transform: translateY(-50%);
}

.process-bar-area {
    text-align: left;
    width: 75%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}
</style>
