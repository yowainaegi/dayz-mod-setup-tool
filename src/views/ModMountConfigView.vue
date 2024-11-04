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
            <a-button @click="back" class="default-btn">{{ $t('ModMountConfigView.back') }}</a-button>
            <a-button @click="next" type="primary" v-if="!isComplete">{{ $t('ModMountConfigView.next') }}</a-button>
            <a-button @click="completedNext" type="primary" v-if="isComplete">{{ $t('ModMountConfigView.completedNext') }}</a-button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { i18n } from '@/i18n';
import { getPathSep } from '@/utils/OsUtils';
import { ref, Ref } from 'vue';
import ServerConfigFile from '@/server/models/ServerConfigFile';
import { globalErrorHandler } from '@/config/globalErrorHandler';
import { editServerDZCfg, getCfgeconomycoreXmlContent, getConfigFileNameList, writeObjectToXML } from '@/server/api/ModMountConfigApi';
import ResData from '@/server/models/ResData';
const store = useStore();
const router = useRouter();

// 更新标题
store.commit('updatePageTitle', i18n.global.t('ModMountConfigView.pageTitle'));

// 服务器配置文件
const serverConfigFile: ServerConfigFile = store.state.selectedConfigFile;
// 工具创建的文件夹map
const toolCreatedFolderPathMap: Map<string, string[]> = store.state.toolCreatedFolderPathMap;


const percent: Ref<number> = ref(0);
const processFileCount: Ref<number> = ref(0);
const processSrcPath: Ref<string | null> = ref(null);
const processTargetPath: Ref<string | null> = ref(null);
const processTitle: Ref<string> = ref('');
const isCounting: Ref<boolean> = ref(true);
const isComplete: Ref<boolean> = ref(false);
const isFooterShow: Ref<boolean> = ref(true);


const STAGES_TITLE = {
    // 复制地图missons文件
    COPY_MISSIONS_FILE_TO_TARGET_PATH: i18n.global.t('ModMountConfigView.stagesTitle.copy_missions_file_to_target_path'),
    // 复制Mod的XML配置文件
    COPY_MOD_CONFIG_XML_TO_TARGET_PATH: i18n.global.t('ModMountConfigView.stagesTitle.copy_mod_config_xml_to_target_path'),
    // 全部完成
    COMPLETED: i18n.global.t('ModMountConfigView.stagesTitle.completed')
}


// 进度管理器
class ProgressManager {
    private taskProgress: Map<string, number> = new Map();
    private totalTasks: number;
    private totalProgress: number = 0;

    constructor(totalTasks: number) {
        this.totalTasks = totalTasks;
    }

    // 更新每个任务的进度
    updateProgress(taskId: string, progress: number) {
        console.log(taskId, progress);
        this.taskProgress.set(taskId, progress);
        this.displayTotalProgress();
    }
    // 计算并显示总进度
    private displayTotalProgress() {
        this.totalProgress = 0;
        this.taskProgress.forEach((progress) => {
            this.totalProgress += progress;
        });
        const overallProgress = this.totalProgress / this.totalTasks;
        percent.value = Math.round(overallProgress * 10) / 10;
    }
}

async function start() {

    // 获取系统路径分隔符
    const PATH_SEP = await getPathSep();
    let missionFolderName = 'dayzOffline.chernarusplus';
    let currentMissionPath = `${serverConfigFile.server_folder_path}${PATH_SEP}mpmissions${PATH_SEP}dayzOffline.chernarusplus`;

    // 接收osService报错
    window.ipcRenderer.receive('os-service-process-error', (errMsg: string) => {
        isFooterShow.value = true;
        globalErrorHandler(errMsg);
    })

    // 先寻找地图mod
    let mapMissionPath = null;
    let mapModCount = 0;
    let partOfTaskCount = 0;
    for (let key of toolCreatedFolderPathMap.keys()) {
        const createdFolderPath = toolCreatedFolderPathMap.get(key);
        if (createdFolderPath === undefined) {
            throw Error("DAYZ_MOD_SETUP_TOOL_CREATED folder is undefined");
        }
        // DAYZ_MOD_SETUP_TOOL_CREATED\map_missions
        for (let path of createdFolderPath) {
            partOfTaskCount++;
            if (path.indexOf(`DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}map_missions`) !== -1) {
                mapModCount++;
                mapMissionPath = path;
            }
        }
    }    

    let totalTasks = 2;
    // 如果找到1个以上的map_mission，报错
    if (mapModCount > 1) {
        throw Error("Has more than 1 map mod want to create");
    } else if (mapModCount === 1) {
        totalTasks += partOfTaskCount;
    }
    const progressManager = new ProgressManager(totalTasks);

    // 接收计算文件进度
    window.ipcRenderer.receive('countFileProgress', (progress: number) => {
        processFileCount.value += progress
    });

    for (let i = 1; i <= totalTasks; i++) {
        // 接收生成进度
        window.ipcRenderer.receive(`${i}_generateProgress`, (progress: number, srcPath: string, targetPath: string) => {
            processSrcPath.value = srcPath;
            processTargetPath.value = targetPath;
            progressManager.updateProgress(
                `${i}`,
                progress
            );
        });
    }


    if (!serverConfigFile.server_folder_path) {
        throw new Error(`serverConfigFile.server_folder_path is incorrect: ${serverConfigFile.server_folder_path}`)
    }

    let taskNo = 1;
    if (mapMissionPath && mapModCount === 1) {

        processTitle.value = STAGES_TITLE.COPY_MISSIONS_FILE_TO_TARGET_PATH;
        // 计算文件数量
        isCounting.value = true;
        await window.ipcRenderer.invoke('countFiles', mapMissionPath);
     
        // 定义missions文件夹名称        
        const validateRes: ResData = await window.ipcRenderer.invoke('serverAPI', 'pathMissionsFolderValidate', mapMissionPath)
        missionFolderName = validateRes.data;

        // 执行missions文件的复制
        isCounting.value = false;
        await window.ipcRenderer.invoke('copyFolderWithProgress',
            `${taskNo++}`,
            `${mapMissionPath}${PATH_SEP}${missionFolderName}`,
            `${serverConfigFile.server_folder_path}${PATH_SEP}mpmissions${PATH_SEP}${missionFolderName}`
        )

        currentMissionPath = `${serverConfigFile.server_folder_path}${PATH_SEP}mpmissions${PATH_SEP}${missionFolderName}`

        // 修改serverDZ.cfg
        await editServerDZCfg(missionFolderName, `${serverConfigFile.server_folder_path}${PATH_SEP}serverDZ.cfg`, serverConfigFile.server_folder_path);
        progressManager.updateProgress(
            `${taskNo++}`,
            100
        );
    }


    processTitle.value = STAGES_TITLE.COPY_MOD_CONFIG_XML_TO_TARGET_PATH;
    for (let key of toolCreatedFolderPathMap.keys()) {
        const createdFolderPath = toolCreatedFolderPathMap.get(key);
        if (createdFolderPath === undefined) {
            throw Error("DAYZ_MOD_SETUP_TOOL_CREATED folder is undefined");
        }

        // 计算文件数量
        isCounting.value = true;
        await window.ipcRenderer.invoke('countFiles', key);


        // DAYZ_MOD_SETUP_TOOL_CREATED\map_missions
        isCounting.value = false;
        for (let path of createdFolderPath) {
            if (path.indexOf(`DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}map_missions`) === -1) {
                
                // id+@名称名称 / DAYZ_MOD_SETUP_TOOL_CREATED 下所有文件copy到 missions文件夹下，全是空文件夹除外
                // 验证路径是否为空
                const resData: ResData = await window.ipcRenderer.invoke('serverAPI', 'pathCleanValidate', path);

              
                const configFolderName = path.substring(path.indexOf(`DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}`) + `DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}`.length)
                const modName = path.substring(path.indexOf(`${serverConfigFile.server_folder_path}${PATH_SEP}`) + `${serverConfigFile.server_folder_path}${PATH_SEP}`.length, path.indexOf(`${PATH_SEP}DAYZ_MOD_SETUP_TOOL_CREATED`))

                if (!resData.data) {
                    // 执行复制
                    await window.ipcRenderer.invoke('copyFolderWithProgress',
                        `${taskNo++}`,
                        `${key}${PATH_SEP}${configFolderName}`,
                        `${serverConfigFile.server_folder_path}${PATH_SEP}mpmissions${PATH_SEP}${missionFolderName}${PATH_SEP}${modName}${PATH_SEP}${configFolderName}`
                    )
                } else {
                    progressManager.updateProgress(
                        `${taskNo++}`,
                        100
                    );
                }
            }
        }   
    }

    // TASK
    // 添加mod配置到CfgeconomycoreXml
    const cfgeconomycoreXmlContent = await getCfgeconomycoreXmlContent(`${currentMissionPath}${PATH_SEP}cfgeconomycore.xml`);
    if(!cfgeconomycoreXmlContent.economycore.ce) {
        cfgeconomycoreXmlContent.economycore.ce = []
    }
    // 合成CE列表
    for (let key of toolCreatedFolderPathMap.keys()) {
        // 主文件夹，对应CE的Folder
        const CE_MainFolder = key.substring(key.indexOf(`${serverConfigFile.server_folder_path}${PATH_SEP}`) + `${serverConfigFile.server_folder_path}${PATH_SEP}`.length, key.indexOf(`${PATH_SEP}DAYZ_MOD_SETUP_TOOL_CREATED`))

        const createdFolderPath = toolCreatedFolderPathMap.get(key);
        if (createdFolderPath === undefined) {
            throw Error("DAYZ_MOD_SETUP_TOOL_CREATED folder is undefined");
        }

        // type文件夹与type，对应CE的foler/type，对应File的type
        for (let configFolderPath of createdFolderPath) {
            const typeFolder = configFolderPath.substring(configFolderPath.indexOf(`DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}`) + `DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}`.length)
            const configFileNameList = await getConfigFileNameList(configFolderPath);
            if(typeFolder === 'map_missions') {
                continue;
            } else if(!configFileNameList || configFileNameList.length < 1) {
                continue;
            }

            const cdItem: { $: { folder: string }; file: any[] } = {
                $: { folder: `${CE_MainFolder}/${typeFolder}` },
                file: []
            }

            for(let file of configFileNameList) {
                const fileItem = { 
                    $: { name: file.name, type: typeFolder }
                }
                cdItem.file.push(fileItem);
            }
            cfgeconomycoreXmlContent.economycore.ce.push(cdItem);
        }
    }

    // 将内容写入CfgeconomycoreXml
    await writeObjectToXML(cfgeconomycoreXmlContent, `${currentMissionPath}${PATH_SEP}cfgeconomycore.xml`);
    progressManager.updateProgress(
        `${taskNo++}`,
        100
    );
    
    processTitle.value = STAGES_TITLE.COMPLETED;
    isComplete.value = true;
}


/**
 * 返回
 */
function back() {
    router.push('/ModChoose');
}

/**
 * 下一步
 */
function next() {
    isFooterShow.value = false;
    start().finally(() => {
        isFooterShow.value = true;
    })
}

/**
 * 完成
 */
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