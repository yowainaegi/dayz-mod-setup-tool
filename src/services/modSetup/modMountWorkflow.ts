import { editServerDZCfg, getCfgeconomycoreXmlContent, writeObjectToXML } from "@/server/api/ModMountConfigApi";
import ResData from "@/server/models/ResData";
import { getPathSep } from "@/utils/OsUtils";
import ProgressManager from "@/utils/ProgressManager";
import { CREATED_CONFIG_FOLDER_NAME } from "./constants";
import { appendConfigFoldersToEconomyCore, appendMountItemsToEconomyCore } from "./economyCoreService";
import {
    CreatedModConfig,
    ModCeMountItem,
    ModMountWorkflowParams,
    NormalConfigFolder
} from "./types";

function buildCreatedModConfigs(
    createdFolderPathMap: Map<string, string[]>,
    serverFolderPath: string,
    pathSep: string
): CreatedModConfig[] {
    const configs: CreatedModConfig[] = [];
    const serverRootPrefix = `${serverFolderPath}${pathSep}`;
    const createdFolderSegment = `${pathSep}${CREATED_CONFIG_FOLDER_NAME}`;

    for (const createdRootPath of createdFolderPathMap.keys()) {
        const createdFolderPaths = createdFolderPathMap.get(createdRootPath);
        if (createdFolderPaths === undefined) {
            throw Error(`${CREATED_CONFIG_FOLDER_NAME} folder is undefined`);
        }

        const modFolderName = createdRootPath.substring(
            createdRootPath.indexOf(serverRootPrefix) + serverRootPrefix.length,
            createdRootPath.indexOf(createdFolderSegment)
        );

        const configFolders = createdFolderPaths.map((folderPath) => {
            const type = folderPath.substring(folderPath.indexOf(`${CREATED_CONFIG_FOLDER_NAME}${pathSep}`) + `${CREATED_CONFIG_FOLDER_NAME}${pathSep}`.length);
            return {
                type,
                path: folderPath,
                isMapMissions: type === 'map_missions'
            };
        });

        configs.push({
            modFolderName,
            createdRootPath,
            configFolders
        });
    }

    return configs;
}

function buildNormalConfigFolders(createdModConfigs: CreatedModConfig[]): NormalConfigFolder[] {
    return createdModConfigs.flatMap((config) => {
        return config.configFolders
            .filter((folder) => !folder.isMapMissions)
            .map((folder) => ({
                ...folder,
                modFolderName: config.modFolderName
            }));
    });
}

function buildMountTargetPath(serverFolderPath: string, missionFolderName: string, mountItem: ModCeMountItem, pathSep: string): string {
    return [
        serverFolderPath,
        'mpmissions',
        missionFolderName,
        CREATED_CONFIG_FOLDER_NAME,
        mountItem.modFolderName,
        mountItem.selectedType,
        mountItem.fileName
    ].join(pathSep);
}

async function runModMountWorkflow(params: ModMountWorkflowParams): Promise<void> {
    const {
        configFile,
        createdFolderPathMap,
        stageTitles,
        receiveIpc,
        onProgressChange,
        onStageTitleChange,
        onCopyingFileChange,
        onFileCountIncrement,
        onCountingChange,
        mountItems
    } = params;
    const pathSep = await getPathSep();
    if (!configFile.server_folder_path) {
        throw new Error(`configFile.server_folder_path is incorrect: ${configFile.server_folder_path}`);
    }

    let missionFolderName = 'dayzOffline.chernarusplus';
    let currentMissionPath = `${configFile.server_folder_path}${pathSep}mpmissions${pathSep}${missionFolderName}`;
    const createdModConfigs = buildCreatedModConfigs(createdFolderPathMap, configFile.server_folder_path, pathSep);
    const normalConfigFolders = buildNormalConfigFolders(createdModConfigs);
    const effectiveMountItems = (mountItems || []).filter((mountItem) => mountItem.mountKind === 'economycore');
    const useMountItems = effectiveMountItems.length > 0;
    const missionSelection = params.missionSelection;

    let totalTasks = useMountItems ? effectiveMountItems.length : normalConfigFolders.length;
    totalTasks += 1;
    if (missionSelection?.missionFolderName) {
        missionFolderName = missionSelection.missionFolderName;
        currentMissionPath = `${configFile.server_folder_path}${pathSep}mpmissions${pathSep}${missionFolderName}`;
    } else if (configFile.server_map_mission_path) {
        const validateRes: ResData = await window.ipcRenderer.invoke('serverAPI', 'pathMissionsFolderValidate', configFile.server_map_mission_path);
        missionFolderName = validateRes.data;
        currentMissionPath = `${configFile.server_folder_path}${pathSep}mpmissions${pathSep}${missionFolderName}`;
    }

    if (missionSelection?.sourcePath) {
        totalTasks += 2;
    }

    const progressManager = new ProgressManager(totalTasks, onProgressChange);

    receiveIpc('countFileProgress', (progress: number) => {
        onFileCountIncrement(progress);
    });

    for (let i = 1; i <= totalTasks; i++) {
        receiveIpc(`${i}_generateProgress`, (progress: number, srcPath: string, targetPath: string) => {
            onCopyingFileChange(srcPath, targetPath);
            progressManager.updateProgress(`${i}`, progress);
        });
    }

    let taskNo = 1;
    if (missionSelection?.sourcePath) {
        onStageTitleChange(stageTitles.copyMissions);
        onCountingChange(true);
        await window.ipcRenderer.invoke('countFiles', missionSelection.sourcePath);

        onCountingChange(false);
        await window.ipcRenderer.invoke(
            'copyFolderWithProgress',
            `${taskNo++}`,
            missionSelection.sourcePath,
            `${configFile.server_folder_path}${pathSep}mpmissions${pathSep}${missionFolderName}`
        );

        currentMissionPath = `${configFile.server_folder_path}${pathSep}mpmissions${pathSep}${missionFolderName}`;
        await editServerDZCfg(missionFolderName, `${configFile.server_folder_path}${pathSep}serverDZ.cfg`, configFile.server_folder_path);
        progressManager.updateProgress(`${taskNo++}`, 100);
    } else if (missionSelection?.missionFolderName) {
        await editServerDZCfg(missionFolderName, `${configFile.server_folder_path}${pathSep}serverDZ.cfg`, configFile.server_folder_path);
    }

    onStageTitleChange(stageTitles.copyModConfigXml);
    if (useMountItems) {
        for (const mountItem of effectiveMountItems) {
            onCountingChange(false);
            await window.ipcRenderer.invoke(
                'copyFilesWithProgress',
                `${taskNo++}`,
                [{
                    srcPath: mountItem.sourcePath,
                    targetPath: buildMountTargetPath(configFile.server_folder_path, missionFolderName, mountItem, pathSep)
                }]
            );
        }
    } else {
        for (const configFolder of normalConfigFolders) {
            onCountingChange(true);
            await window.ipcRenderer.invoke('countFiles', configFolder.path);

            onCountingChange(false);
            const resData: ResData = await window.ipcRenderer.invoke('serverAPI', 'pathCleanValidate', configFolder.path);
            if (!resData.data) {
                await window.ipcRenderer.invoke(
                    'copyFolderWithProgress',
                    `${taskNo++}`,
                    configFolder.path,
                    `${configFile.server_folder_path}${pathSep}mpmissions${pathSep}${missionFolderName}${pathSep}${configFolder.modFolderName}${pathSep}${configFolder.type}`
                );
            } else {
                progressManager.updateProgress(`${taskNo++}`, 100);
            }
        }
    }

    if (useMountItems) {
        const cfgeconomycoreXmlContent = await getCfgeconomycoreXmlContent(`${currentMissionPath}${pathSep}cfgeconomycore.xml`);
        appendMountItemsToEconomyCore(cfgeconomycoreXmlContent, effectiveMountItems);
        await writeObjectToXML(cfgeconomycoreXmlContent, `${currentMissionPath}${pathSep}cfgeconomycore.xml`);
        progressManager.updateProgress(`${taskNo++}`, 100);
    } else {
        const cfgeconomycoreXmlContent = await getCfgeconomycoreXmlContent(`${currentMissionPath}${pathSep}cfgeconomycore.xml`);
        await appendConfigFoldersToEconomyCore(cfgeconomycoreXmlContent, normalConfigFolders);
        await writeObjectToXML(cfgeconomycoreXmlContent, `${currentMissionPath}${pathSep}cfgeconomycore.xml`);
        progressManager.updateProgress(`${taskNo++}`, 100);
    }

    onStageTitleChange(stageTitles.completed);
}

export {
    runModMountWorkflow
};
