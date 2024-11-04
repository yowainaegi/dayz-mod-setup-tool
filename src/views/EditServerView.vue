<template>
  <div id="EditServer" class="view-wrap">
    <div class="view-content">
      <div>{{ processTitle }}</div>
      <a-progress :percent="percent" :show-info="false" />
      <div v-if="!isCounting && !isComplete">{{ $t('EditServerView.copyingContent', { percent, src: processSrcPath, dest: processTargetPath }) }} </div>
      <div v-if="isCounting && !isComplete">{{ $t('EditServerView.fileFound', { processFileCount } ) }}</div>
    </div>
    <div class="footer-content" v-if="showFoot">
      <a-button @click="back" class="default-btn">{{ $t('EditServerView.back') }}</a-button>
      <a-button @click="next" type="primary">{{ $t('EditServerView.next') }}</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useRouter} from "vue-router";
import { useStore } from "vuex";
import {i18n} from "@/i18n";
import { ref, Ref } from "vue";
import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { createServerProfileFolder, editServerDZCfg, editStartBatFile } from "@/server/api/EditServerApi";
import { globalErrorHandler } from "@/config/globalErrorHandler";
import { getPathSep } from "@/utils/OsUtils";


const router = useRouter();
const store = useStore();
const percent: Ref<number> = ref(0);
const processTitle: Ref<string | null> = ref(null);
const processSrcPath: Ref<string | null> = ref(null);
const processTargetPath: Ref<string | null> = ref(null);
const processFileCount: Ref<number> = ref(0);
const isCounting: Ref<boolean> = ref(false);
const isComplete: Ref<boolean> = ref(false);
const showFoot: Ref<boolean> = ref(false);

// 已加入MOD文件对象List
let modAddedList: ModInfo[] = store.state.modAddedList;
// 服务器配置文件
const serverConfigFile: ServerConfigFile = store.state.selectedConfigFile;

const operationMode = store.state.operationMode;

// 用来存储在mod文件夹中创建好DAYZ_MOD_SETUP_TOOL_CREATED文件夹路径
const toolCreatedFolderPathMap: Map<string, string[]> = new Map();

// 更新标题
if(operationMode === 'create') {
  store.commit('updatePageTitle', i18n.global.t('EditServerView.pageTitle.create'));
} else {
  store.commit('updatePageTitle', i18n.global.t('EditServerView.pageTitle.update'));
}



const STAGES_TITLE = {
  // 复制纯净DayZServer文件到指定目录
  COPY_PURE_DAYZ_SERVER_FILE_TO_TARGET_PATH: i18n.global.t('EditServerView.stagesTitle.copy_pure_dayz_server_file_to_target_path'),
  // 复制Addons到新建的服务器文件夹中
  COPY_ADDONS_TO_TARGET_PATH: i18n.global.t('EditServerView.stagesTitle.copy_addons_to_target_path'),
  // 复制Keys到新建的服务器文件夹中
  COPY_KEYS_TO_TARGET_PATH: i18n.global.t('EditServerView.stagesTitle.copy_keys_to_target_path'),
  // 复制MOD到新建的服务器文件夹中
  COPY_MODS_TO_TARGET_PATH: i18n.global.t('EditServerView.stagesTitle.copy_mods_to_target_path'),
  // 创建服务器文件夹
  CREATE_SERVER_PROFILE_FOLDER: i18n.global.t('EditServerView.stagesTitle.create_server_profile_folder'),
  // 编辑启动BAT
  EDIT_START_UP_FILE: i18n.global.t('EditServerView.stagesTitle.edit_start_up_file'),
  // 编辑serverDZ.cfg文件
  EDIT_SERVER_DZ_CFG_FILE: i18n.global.t('EditServerView.stagesTitle.edit_server_dz_cfg_file'),
  // 全部完成
  COMPLETED: i18n.global.t('EditServerView.stagesTitle.completed'),
}


const MOD_FOLDER_NAME = {
  // Addons
  ADDONS: 'Addons',
  // Keys
  KEYS: 'Keys',
  // Key
  KEY: 'Key',
  // Types
  TYPES: 'Types',
  // Events
  EVENTS: 'Events'
}

const TASK_MODE = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE'
}

const MOD_CONFIG_FOLDERS = [
  'types', // interprets file as types.xml
  'spawnabletypes', // interprets file as cfgspawnabletypes.xml
  'globals', // interprets file as globals.xml
  'economy',  // interprets file as economy.xml
  'events', // interprets file as events.xml
  'messages', // interprets file as messages.xml
  'map_missions' // map missions folder
]


async function task(totalTasks: number, progressManager: ProgressManager, mode: string) {
  // 获取系统路径分隔符
  const PATH_SEP = await getPathSep();

  // 接收计算文件进度
  window.ipcRenderer.receive('countFileProgress', (progress: number) => {
    processFileCount.value += progress
  });

  window.ipcRenderer.receive('resetCountFile', () => {
    processFileCount.value = 0;  
  });

  for(let i = 1; i <= totalTasks; i ++) {
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

  // Keys文件夹列表
  const keysPathList: string[] = [];
  for(let i = 0; i < modAddedList.length; i++) {
    // 验证是否含有keys文件夹
    let keyFolderPath = `${modAddedList[i].ExtensionPath}${PATH_SEP}${MOD_FOLDER_NAME.KEYS}`;

    try {
      await window.ipcRenderer.invoke('serverAPI', 'pathValidate', keyFolderPath)
      keysPathList.push(keyFolderPath);
    } catch (e) {
      // 如果没有keys则使用key
      keyFolderPath = `${modAddedList[i].ExtensionPath}${PATH_SEP}${MOD_FOLDER_NAME.KEY}`;
      keysPathList.push(keyFolderPath);
    }
  }

  // MOD文件夹Map，主要讲modFolderName加上，copyMOD文件夹重命名时需要
  class ModsPathObj {
    extensionPath: string = "";
    modFolderName: string = "";
    isMapMod: boolean = false;
  }
  const modsPathMap: Map<string, ModsPathObj> = new Map();
  // MOD文件夹列表
  const modsPathList: string[] = [];
  for(let i = 0; i < modAddedList.length; i++) {
    modsPathList.push(modAddedList[i].ExtensionPath);
    const obj: ModsPathObj = {
      extensionPath: modAddedList[i].ExtensionPath,
      modFolderName: modAddedList[i].modFolderName,
      isMapMod: modAddedList[i].isMapMod
    }
    modsPathMap.set(modAddedList[i].Id, obj);
  } 


  if(serverConfigFile.pure_server_folder_path && serverConfigFile.server_folder_path && serverConfigFile.deploy_server_folder_path) {

    let taskNo = 1;

   if(mode === TASK_MODE.CREATE) {
      // TASK：复制纯净服务器
      processTitle.value = STAGES_TITLE.COPY_PURE_DAYZ_SERVER_FILE_TO_TARGET_PATH;
      // 计算文件数量
      isCounting.value = true;
      await window.ipcRenderer.invoke('countFiles', serverConfigFile.pure_server_folder_path);

      // 执行复制
      isCounting.value = false;
      await window.ipcRenderer.invoke('copyFolderWithProgress',
        `${taskNo++}`,
        serverConfigFile.pure_server_folder_path, 
        serverConfigFile.server_folder_path
      )
   }
      
    // TASK：复制Keys
    processTitle.value = STAGES_TITLE.COPY_KEYS_TO_TARGET_PATH;
    // 计算文件数量
    isCounting.value = true;
    await window.ipcRenderer.invoke('countFilesInMultipFolder', keysPathList);

    // 执行复制
    isCounting.value = false;
    await window.ipcRenderer.invoke('copyMultipleFolders',
      `${taskNo++}`,
      keysPathList,
      `${serverConfigFile.server_folder_path}${PATH_SEP}${MOD_FOLDER_NAME.KEYS}`
    )


    // TASK：复制MOD
    processTitle.value = STAGES_TITLE.COPY_MODS_TO_TARGET_PATH;

    // 计算文件数量
    isCounting.value = true;
    await window.ipcRenderer.invoke('countFilesInMultipFolder', modsPathList);
    
    for(let key of modsPathMap.keys()) {
      // 执行复制
      isCounting.value = false;
      await window.ipcRenderer.invoke('copyFolderWithProgress',
        `${taskNo++}`,
        modsPathMap.get(key)?.extensionPath,
        `${serverConfigFile.server_folder_path}${PATH_SEP}${modsPathMap.get(key)?.modFolderName}`
      )
      // TASK: 在MOD文件夹中创建各个Config文件夹
      await window.ipcRenderer.invoke(
        'serverAPI',
        'createModConfigFolders',
        `${serverConfigFile.server_folder_path}${PATH_SEP}${modsPathMap.get(key)?.modFolderName}${PATH_SEP}DAYZ_MOD_SETUP_TOOL_CREATED`,
        MOD_CONFIG_FOLDERS, modsPathMap.get(key)?.isMapMod)

        const toolCreatedFolderDetailPaths: string[] = [];
        for(let item of MOD_CONFIG_FOLDERS) {
          if(item !== 'map_missions') {
            toolCreatedFolderDetailPaths.push(
              `${serverConfigFile.server_folder_path}${PATH_SEP}${modsPathMap.get(key)?.modFolderName}${PATH_SEP}DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}${item}`)
          } else if (item === 'map_missions' && modsPathMap.get(key)?.isMapMod) {
            toolCreatedFolderDetailPaths.push(
              `${serverConfigFile.server_folder_path}${PATH_SEP}${modsPathMap.get(key)?.modFolderName}${PATH_SEP}DAYZ_MOD_SETUP_TOOL_CREATED${PATH_SEP}${item}`)
          }
        }
        toolCreatedFolderPathMap.set(`${serverConfigFile.server_folder_path}${PATH_SEP}${modsPathMap.get(key)?.modFolderName}${PATH_SEP}DAYZ_MOD_SETUP_TOOL_CREATED`,toolCreatedFolderDetailPaths)
        
    }

    if(serverConfigFile.server_folder_path && serverConfigFile.server_profile_folder) {
      // TASK 5：创建服务器配置文件夹profile
      processTitle.value = STAGES_TITLE.CREATE_SERVER_PROFILE_FOLDER;
        await createServerProfileFolder(serverConfigFile.server_folder_path, serverConfigFile.server_profile_folder);
        progressManager.updateProgress(
            `${taskNo++}`,
            100
          );

      // TASK 6：编辑启动BAT文件
      processTitle.value = STAGES_TITLE.EDIT_START_UP_FILE;
        await editStartBatFile(modAddedList, serverConfigFile.deploy_server_folder_path, serverConfigFile.server_profile_folder, false);
        progressManager.updateProgress(
          `${taskNo++}`,
          100
        );
    }

     // TASK 7：编辑ServerDZ.cfg文件
     processTitle.value = STAGES_TITLE.EDIT_SERVER_DZ_CFG_FILE;
    if(serverConfigFile.server_name) {
      await editServerDZCfg(
        serverConfigFile.server_name,
        `${serverConfigFile.server_folder_path}${PATH_SEP}serverDZ.cfg`,
        serverConfigFile.server_folder_path);
      progressManager.updateProgress(
        `${taskNo++}`,
        100
      );
    }

    // 完成
    processTitle.value = STAGES_TITLE.COMPLETED;
    isComplete.value = true;
  }
}


// 创建服务器
async function runCreateTasks() {
  const totalTasks = 5 + modAddedList.length;
  const progressManager = new ProgressManager(totalTasks);
  task(totalTasks, progressManager, TASK_MODE.CREATE);
}

// 更新服务器
async function runUpdateTasks() {
  modAddedList = modAddedList.filter(item => item.CanBeRemovedDZMSUTool)
  const totalTasks = 3 + modAddedList.length;
  const progressManager = new ProgressManager(totalTasks);
  task(totalTasks, progressManager, TASK_MODE.UPDATE);
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

  // 接收osService报错
  window.ipcRenderer.receive('os-service-process-error', (errMsg: string) => {
    showFoot.value = true;
    globalErrorHandler(errMsg);
  })


  if(operationMode === 'create') {
    await runCreateTasks();
  } else {
    await runUpdateTasks();
  }
}


// 开始执行
start().finally(() => {
  showFoot.value = true;
})


/**
 * 返回
 */
 function back() {
  router.push('/ModChoose');
}

function next() {
  store.commit('updateToolCreatedFolderPathMap', toolCreatedFolderPathMap);
  router.push('/ModMountConfig')
}
</script>

<style scoped lang="less">
.view-content {
  width: 75%;
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
}

</style>