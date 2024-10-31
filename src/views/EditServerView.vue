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
      <a-button @click="next" type="primary">{{ $t('EditServerView.completedNext') }}</a-button>
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
  // Types
  TYPES: 'Types',
  // Events
  EVENTS: 'Events'
}


// 创建服务器
async function runCreateTasks() {

  // 获取系统路径分隔符
  const PATH_SEP = await getPathSep();

  // 接收计算文件进度
  window.ipcRenderer.receive('countFileProgress', (progress: number) => {
    processFileCount.value += progress
  });

  window.ipcRenderer.receive('resetCountFile', () => {
    processFileCount.value = 0;  
  });


  const totalTasks = 5 + modAddedList.length;
  const progressManager = new ProgressManager(totalTasks);

  for(let i = 1; i <= totalTasks; i ++) {
  // TASK 1：接收复制文件进度
  window.ipcRenderer.receive(`${i}_copyProgress`, (progress: number, srcPath: string, targetPath: string) => {
      processSrcPath.value = srcPath;
      processTargetPath.value = targetPath;
      progressManager.updateProgress(
        `${i}`,
        progress
      );
    });
  }




  // Addons文件夹列表
  const addonsPathList: string[] = [];
  for(let i = 0; i < modAddedList.length; i++) {
    addonsPathList.push(`${modAddedList[i].ExtensionPath}${PATH_SEP}${MOD_FOLDER_NAME.ADDONS}`);
  }

  // Keys文件夹列表
  const keysPathList: string[] = [];
  for(let i = 0; i < modAddedList.length; i++) {
    keysPathList.push(`${modAddedList[i].ExtensionPath}${PATH_SEP}${MOD_FOLDER_NAME.KEYS}`);
  }

  // MOD文件夹列表
  const modsPathList: string[] = [];
  for(let i = 0; i < modAddedList.length; i++) {
    modsPathList.push(modAddedList[i].ExtensionPath);
  }


  if(serverConfigFile.pure_server_folder_path && serverConfigFile.server_folder_path && serverConfigFile.deploy_server_folder_path) {

    let taskNo = 1;

    // TASK 1：复制纯净服务器
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

    // // TASK 2：复制Addons
    // processTitle.value = STAGES_TITLE.COPY_ADDONS_TO_TARGET_PATH;
    // // 计算文件数量
    // isCounting.value = true;
    // await window.ipcRenderer.invoke('countFilesInMultipFolder', addonsPathList);

    // // 执行复制
    // isCounting.value = false;
    // await window.ipcRenderer.invoke('copyMultipleFolders',
    //   `${taskNo++}`,
    //   addonsPathList,
    //   `${serverConfigFile.server_folder_path}${PATH_SEP}${MOD_FOLDER_NAME.ADDONS}`
    // )
   
      
    // TASK 3：复制Keys
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


    // TASK 4：复制MOD
    processTitle.value = STAGES_TITLE.COPY_MODS_TO_TARGET_PATH;

    // 计算文件数量
    isCounting.value = true;
    await window.ipcRenderer.invoke('countFilesInMultipFolder', modsPathList);
    
    for(let i = 0; i < modsPathList.length; i ++) {
      const modFolderName = modsPathList[i].substring(modsPathList[i].lastIndexOf(PATH_SEP) + 1);
      // 执行复制
      isCounting.value = false;
      await window.ipcRenderer.invoke('copyFolderWithProgress',
        `${taskNo++}`,
        modsPathList[i],
        `${serverConfigFile.server_folder_path}${PATH_SEP}${modFolderName}`
      )
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

// 更新服务器
async function runUpdateTasks() {

  // 获取系统路径分隔符
  const PATH_SEP = await getPathSep();

  modAddedList =  modAddedList.filter((item: ModInfo) => item.CanBeRemovedDZMSUTool);

  // 接收计算文件进度
  window.ipcRenderer.receive('countFileProgress', (progress: number) => {
    processFileCount.value += progress
  });

  window.ipcRenderer.receive('resetCountFile', () => {
    processFileCount.value = 0;
  });


  const totalTasks = 3 + modAddedList.length;
  const progressManager = new ProgressManager(totalTasks);

  for(let i = 1; i <= totalTasks; i ++) {
    // 接收复制文件进度
    window.ipcRenderer.receive(`${i}_copyProgress`, (progress: number, srcPath: string, targetPath: string) => {
        processSrcPath.value = srcPath;
        processTargetPath.value = targetPath;
        progressManager.updateProgress(
          `${i}`,
          progress
        );
      });
    }

    // Addons文件夹列表
    const addonsPathList: string[] = [];
    for(let i = 0; i < modAddedList.length; i++) {
      addonsPathList.push(`${modAddedList[i].ExtensionPath}${PATH_SEP}${MOD_FOLDER_NAME.ADDONS}`);
    }

    // Keys文件夹列表
    const keysPathList: string[] = [];
    for(let i = 0; i < modAddedList.length; i++) {
      keysPathList.push(`${modAddedList[i].ExtensionPath}${PATH_SEP}${MOD_FOLDER_NAME.KEYS}`);
    }

    // MOD文件夹列表
    const modsPathList: string[] = [];
    for(let i = 0; i < modAddedList.length; i++) {
      modsPathList.push(modAddedList[i].ExtensionPath);
    }


    if(serverConfigFile.pure_server_folder_path && serverConfigFile.server_folder_path) {

    let taskNo = 1;

    // // TASK 1：复制Addons
    // processTitle.value = STAGES_TITLE.COPY_ADDONS_TO_TARGET_PATH;

    // // 计算文件数量
    // isCounting.value = true;
    // await window.ipcRenderer.invoke('countFilesInMultipFolder', addonsPathList);

    // // 执行复制
    // isCounting.value = false;
    // await window.ipcRenderer.invoke('copyMultipleFolders',
    //   `${taskNo++}`,
    //   addonsPathList,
    //   `${serverConfigFile.server_folder_path}${PATH_SEP}${MOD_FOLDER_NAME.ADDONS}`
    // )
      
    // TASK 1：复制Keys
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


    // TASK 2：复制MOD
    processTitle.value = STAGES_TITLE.COPY_MODS_TO_TARGET_PATH;

    // 计算文件数量
    isCounting.value = true;
    await window.ipcRenderer.invoke('countFilesInMultipFolder', modsPathList);
    
    for(let i = 0; i < modsPathList.length; i ++) {
      const modFolderName = modsPathList[i].substring(modsPathList[i].indexOf(PATH_SEP));
      // 执行复制
      isCounting.value = false;
      await window.ipcRenderer.invoke('copyFolderWithProgress',
        `${taskNo++}`,
        modsPathList[i],
        `${serverConfigFile.server_folder_path}${PATH_SEP}${modFolderName}`
      )
    }

    if(serverConfigFile.server_folder_path && serverConfigFile.server_profile_folder) {
      
      // TASK 3：编辑启动BAT文件
      processTitle.value = STAGES_TITLE.EDIT_START_UP_FILE;
        await editStartBatFile(modAddedList, serverConfigFile.server_folder_path, serverConfigFile.server_profile_folder, true);
        progressManager.updateProgress(
          `${taskNo++}`,
          100
        );
    }

    // TASK 4：编辑ServerDZ.cfg文件
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
    globalErrorHandler(errMsg);
    showFoot.value = true;
  })


  if(operationMode === 'create') {
    await runCreateTasks();
  } else {
    await runUpdateTasks();
  }
}


// 开始执行
start().then(() => {
  showFoot.value = true;
})


/**
 * 返回
 */
 function back() {
  router.push('/ModChoose');
}

function next() {
  router.push('/Index')
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