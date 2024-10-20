import ResData from "@/server/models/ResData";
import { transToResData } from "@/utils/ResUtils";
import { modifyAppConfigByConfigName, selectAppConfigByConfigName } from "@/server/sqlite/SqlFuncs/AppConfig";
import AppConfig from "@/server/models/AppConfig";

/**
 * 获取windows用户名
 */
export function getWindowsUserName(): Promise<string> {
    return new Promise((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getOsUserName').then((resData: ResData) => {
            resolve(resData.data);
        });
    })
}

/**
 * 获取所有预设文件名
 */
export function getPresetFileNameList(presetFileFolderPath: string): Promise<any[]> {
    return new Promise<any[]>((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getFileNameList', presetFileFolderPath).then((resData: ResData) => {
            resolve(resData.data);
        });
    })
}

/**
 * 获取DayZ启动器数据文件夹
 */
export function getDayZLauncherDataFolderPath(osUsername: string): Promise<string> {
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSepResData: ResData) => {
            const PATH_SEP = pathSepResData.data;
            const path = `C:${PATH_SEP}Users${PATH_SEP}${osUsername}${PATH_SEP}AppData${PATH_SEP}Local${PATH_SEP}DayZ Launcher`
            window.ipcRenderer.invoke('serverAPI', 'getDirectoryPath', path).then((directoryPathResData: ResData) => {
                resolve(directoryPathResData.data);
            });
        });
    })
}

/**
 * 获取预设文件夹路径
 */
export function getPresetFileFolderPath(osUsername: string): Promise<string> {
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSepResData: ResData) => {
            const PATH_SEP = pathSepResData.data;
            const path = `C:${PATH_SEP}Users${PATH_SEP}${osUsername}${PATH_SEP}AppData${PATH_SEP}Local${PATH_SEP}DayZ Launcher${PATH_SEP}Presets`
            window.ipcRenderer.invoke('serverAPI', 'getDirectoryPath', path).then((directoryPathResData: ResData) => {
                resolve(directoryPathResData.data);
            });
        });
    })
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