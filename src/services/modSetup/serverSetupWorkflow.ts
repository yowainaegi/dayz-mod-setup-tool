import { createServerProfileFolder, editServerDZCfg, editStartBatFile } from "@/server/api/EditServerApi";
import { getPathSep } from "@/utils/OsUtils";
import ProgressManager from "@/utils/ProgressManager";
import ModInfo from "@/server/models/ModInfo";
import { CREATED_CONFIG_FOLDER_NAME, MOD_CONFIG_FOLDERS, MOD_FOLDER_NAME, MOD_MOUNT_MODE, TASK_MODE } from "./constants";
import {
    ModCopyItem,
    ServerSetupWorkflowParams,
    ServerSetupWorkflowResult,
    TaskMode
} from "./types";

async function pathExists(targetPath: string): Promise<boolean> {
    try {
        await window.ipcRenderer.invoke('serverAPI', 'pathValidate', targetPath);
        return true;
    } catch (_error) {
        return false;
    }
}

async function findModKeyFolder(extensionPath: string, pathSep: string): Promise<string | null> {
    const candidateFolders = [
        `${extensionPath}${pathSep}${MOD_FOLDER_NAME.KEYS}`,
        `${extensionPath}${pathSep}${MOD_FOLDER_NAME.KEY}`
    ];

    for (const candidateFolder of candidateFolders) {
        if (await pathExists(candidateFolder)) {
            return candidateFolder;
        }
    }

    return null;
}

function buildModCopyItems(modList: ModInfo[], serverFolderPath: string, pathSep: string): ModCopyItem[] {
    return modList.map((mod) => {
        const targetPath = `${serverFolderPath}${pathSep}${mod.modFolderName}`;
        return {
            id: mod.Id,
            sourcePath: mod.ExtensionPath,
            folderName: mod.modFolderName,
            targetPath,
            createdConfigRootPath: `${targetPath}${pathSep}${CREATED_CONFIG_FOLDER_NAME}`,
            isMapMod: false
        };
    });
}

function buildCreatedFolderDetailPaths(modCopyItem: ModCopyItem, pathSep: string): string[] {
    const folderPaths: string[] = [];
    for (const folderName of MOD_CONFIG_FOLDERS) {
        if (folderName !== 'map_missions') {
            folderPaths.push(`${modCopyItem.createdConfigRootPath}${pathSep}${folderName}`);
        }
    }

    return folderPaths;
}

function calculateTotalTasks(mode: TaskMode, modCount: number): number {
    return mode === TASK_MODE.CREATE ? 5 + modCount : 4 + modCount;
}

async function runServerSetupWorkflow(params: ServerSetupWorkflowParams): Promise<ServerSetupWorkflowResult> {
    const {
        configFile,
        mode,
        stageTitles,
        receiveIpc,
        onProgressChange,
        onStageTitleChange,
        onCopyingFileChange,
        onFileCountIncrement,
        onFileCountReset,
        onCountingChange
    } = params;
    const finalModList = params.modList;
    const removedModList = params.removedModList || [];
    const modList = mode === TASK_MODE.UPDATE
        ? finalModList.filter(item => !item.IsAlreadyAddedToConfig)
        : finalModList;
    const totalTasks = calculateTotalTasks(mode, modList.length);
    const progressManager = new ProgressManager(totalTasks, onProgressChange);
    const createdFolderPathMap: Map<string, string[]> = new Map();
    const pathSep = await getPathSep();

    receiveIpc('countFileProgress', (progress: number) => {
        onFileCountIncrement(progress);
    });
    receiveIpc('resetCountFile', () => {
        onFileCountReset();
    });

    for (let i = 1; i <= totalTasks; i++) {
        receiveIpc(`${i}_generateProgress`, (progress: number, srcPath: string, targetPath: string) => {
            onCopyingFileChange(srcPath, targetPath);
            progressManager.updateProgress(`${i}`, progress);
        });
    }

    const keysPathList: string[] = [];
    for (const mod of modList) {
        const keyFolderPath = await findModKeyFolder(mod.ExtensionPath, pathSep);
        if (keyFolderPath) {
            keysPathList.push(keyFolderPath);
        }
    }

    const modsPathList = modList.map((mod) => mod.ExtensionPath);
    const modMountMode = configFile.mod_mount_mode || MOD_MOUNT_MODE.COPY;

    if (!configFile.pure_server_folder_path || !configFile.server_folder_path || !configFile.deploy_server_folder_path) {
        return { createdFolderPathMap };
    }

    let taskNo = 1;
    const modCopyItems = buildModCopyItems(modList, configFile.server_folder_path, pathSep);

    if (mode === TASK_MODE.UPDATE && removedModList.length > 0) {
        await window.ipcRenderer.invoke(
            'serverAPI',
            'removeModsFromServerWorkspace',
            configFile.server_folder_path,
            removedModList.map((mod) => mod.modFolderName)
        );
    }

    if (mode === TASK_MODE.CREATE) {
        onStageTitleChange(stageTitles.copyPureServer);
        onCountingChange(true);
        await window.ipcRenderer.invoke('countFiles', configFile.pure_server_folder_path);
        onCountingChange(false);
        await window.ipcRenderer.invoke(
            'copyFolderWithProgress',
            `${taskNo++}`,
            configFile.pure_server_folder_path,
            configFile.server_folder_path
        );
    }

    onStageTitleChange(stageTitles.copyKeys);
    onCountingChange(true);
    await window.ipcRenderer.invoke('countFilesInMultipFolder', keysPathList);
    onCountingChange(false);
    await window.ipcRenderer.invoke(
        'copyMultipleFolders',
        `${taskNo++}`,
        keysPathList,
        `${configFile.server_folder_path}${pathSep}${MOD_FOLDER_NAME.KEYS}`
    );

    onStageTitleChange(stageTitles.copyMods);
    onCopyingFileChange(null, null);
    onCountingChange(modMountMode === MOD_MOUNT_MODE.COPY);
    if (modMountMode === MOD_MOUNT_MODE.COPY) {
        await window.ipcRenderer.invoke('countFilesInMultipFolder', modsPathList);
    }

    for (const modCopyItem of modCopyItems) {
        onCountingChange(false);
        if (modMountMode === MOD_MOUNT_MODE.JUNCTION) {
            onCopyingFileChange('Create directory links', modCopyItem.targetPath);
            await window.ipcRenderer.invoke(
                'serverAPI',
                'createModFolderLinks',
                modCopyItem.sourcePath,
                modCopyItem.targetPath
            );
            progressManager.updateProgress(`${taskNo++}`, 100);
        } else {
            await window.ipcRenderer.invoke(
                'copyFolderWithProgress',
                `${taskNo++}`,
                modCopyItem.sourcePath,
                modCopyItem.targetPath
            );
        }
        await window.ipcRenderer.invoke(
            'serverAPI',
            'createModConfigFolders',
            modCopyItem.createdConfigRootPath,
            MOD_CONFIG_FOLDERS,
            false
        );

        const toolCreatedFolderDetailPaths = buildCreatedFolderDetailPaths(modCopyItem, pathSep);
        createdFolderPathMap.set(modCopyItem.createdConfigRootPath, toolCreatedFolderDetailPaths);
    }

    if (configFile.server_folder_path && configFile.server_profile_folder) {
        onStageTitleChange(stageTitles.createProfile);
        await createServerProfileFolder(configFile.server_folder_path, configFile.server_profile_folder);
        progressManager.updateProgress(`${taskNo++}`, 100);

        onStageTitleChange(stageTitles.editStartup);
        await editStartBatFile(finalModList, configFile.deploy_server_folder_path, configFile.server_profile_folder, mode === TASK_MODE.UPDATE);
        progressManager.updateProgress(`${taskNo++}`, 100);
    }

    onStageTitleChange(stageTitles.editServerCfg);
    if (configFile.server_name) {
        await editServerDZCfg(
            configFile.server_name,
            `${configFile.server_folder_path}${pathSep}serverDZ.cfg`,
            configFile.server_folder_path
        );
        progressManager.updateProgress(`${taskNo++}`, 100);
    }

    onStageTitleChange(stageTitles.completed);
    return { createdFolderPathMap };
}

export {
    runServerSetupWorkflow
};
