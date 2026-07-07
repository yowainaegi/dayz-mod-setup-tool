import ResData from "@/server/models/ResData";
import { transToResData } from "@/utils/ResUtils";
import { modifyAppConfigByConfigName, selectAppConfigByConfigName } from "@/server/sqlite/SqlFuncs/AppConfig";
import AppConfig from "@/server/models/AppConfig";

/**
 * 获取windows用户名
 */
export function getWindowsUserName(): Promise<string> {
    return window.ipcRenderer.invoke('serverAPI', 'getOsUserName').then((resData: ResData) => resData.data);
}

/**
 * 获取所有预设文件名
 */
export function getPresetFileNameList(presetFileFolderPath: string): Promise<any[]> {
    return window.ipcRenderer.invoke('serverAPI', 'getFileNameList', presetFileFolderPath).then((resData: ResData) => resData.data);
}

/**
 * 获取DayZ启动器数据文件夹
 */
export async function getDayZLauncherDataFolderPath(osUsername: string): Promise<string> {
    return checkDirectoryPath(await buildDayZLauncherDataFolderPath(osUsername));
}

/**
 * 获取预设文件夹路径
 */
export async function getPresetFileFolderPath(osUsername: string): Promise<string> {
    return checkDirectoryPath(await buildPresetFileFolderPath(osUsername));
}

export async function buildDisplayDayZLauncherDataFolderPath(): Promise<string> {
    const pathSepResData: ResData = await window.ipcRenderer.invoke('serverAPI', 'getPathSep');
    const PATH_SEP = pathSepResData.data;
    return `%LOCALAPPDATA%${PATH_SEP}DayZ Launcher`;
}

export async function buildDisplayPresetFileFolderPath(): Promise<string> {
    const pathSepResData: ResData = await window.ipcRenderer.invoke('serverAPI', 'getPathSep');
    const PATH_SEP = pathSepResData.data;
    return `%LOCALAPPDATA%${PATH_SEP}DayZ Launcher${PATH_SEP}Presets`;
}

export async function buildDayZLauncherDataFolderPath(osUsername: string): Promise<string> {
    const pathSepResData: ResData = await window.ipcRenderer.invoke('serverAPI', 'getPathSep');
    const PATH_SEP = pathSepResData.data;
    return `C:${PATH_SEP}Users${PATH_SEP}${osUsername}${PATH_SEP}AppData${PATH_SEP}Local${PATH_SEP}DayZ Launcher`;
}

export async function buildPresetFileFolderPath(osUsername: string): Promise<string> {
    const pathSepResData: ResData = await window.ipcRenderer.invoke('serverAPI', 'getPathSep');
    const PATH_SEP = pathSepResData.data;
    return `C:${PATH_SEP}Users${PATH_SEP}${osUsername}${PATH_SEP}AppData${PATH_SEP}Local${PATH_SEP}DayZ Launcher${PATH_SEP}Presets`;
}

export async function checkDirectoryPath(path: string): Promise<string> {
    const directoryPathResData: ResData = await window.ipcRenderer.invoke('serverAPI', 'getDirectoryPath', path);
    return directoryPathResData.data;
}

/**
 * 根据配置名获取配置对象
 */
export function getAppConfigByConfigName(configName: string): Promise<AppConfig> {
    return new Promise<AppConfig>((resolve) => {
        selectAppConfigByConfigName(configName).then((res: string) => {
            const resData: ResData = transToResData(res);
            resolve(resData.data as AppConfig);
        })
    })
}

/**
 * 根据配置名更新配置对象
 */
export function updateAppConfigByConfigName(configName: string, configValue: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        modifyAppConfigByConfigName(configName, configValue).then(() => {
            resolve(true);
        })
    })
}
