import { transToResData } from "@/utils/ResUtils";
import ResData from "@/server/models/ResData";
import ConfigFile from "@/server/models/ServerConfigFile";
import { insertConfigFile, modifyConfigFile, selectConfigFileById } from "@/server//sqlite/SqlFuncs/ServerConfigFile";
import { recordLog } from "@/server/sqlite/SqlFuncs/common/common";
import { i18n } from "@/i18n";
import { APIError } from "@/server/constants/LogType";

/**
 * 获取windows用户名
 */
export function getWindowsUserName(): Promise<string> {
    return new Promise((resolve, reject) => {
        window.ipcRenderer.invoke('serverAPI', 'getOsUserName').then((res: ResData) => {
            resolve(res.data);
        }).catch((error: ResData) => {
            recordLog(error.data, APIError, i18n.global.t('common.appLogType.Error.ApiError')).then(() => {
                reject(error);
            })
        })
    });
}

/**
 * 获取所有预设文件名
 */
export function getPresetFileNameList(presetFileFolderPath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        window.ipcRenderer.invoke('serverAPI', 'getFileNameList', presetFileFolderPath).then((res: ResData) => {
            resolve(res.data);
        }).catch((error: ResData) => {
            recordLog(error.data, APIError, i18n.global.t('common.appLogType.Error.ApiError')).then(() => {
                reject(error);
            })
        })
    });
}

/**
 * 获取预设文件夹路径
 */
export function getPresetFileFolderPath(osUsername: string): Promise<string> {
   return new Promise<string>((resolve, reject) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((res: ResData) => {
            const PATH_SEP = res.data;
            let path = `C:${PATH_SEP}Users${PATH_SEP}${osUsername}${PATH_SEP}AppData${PATH_SEP}Local${PATH_SEP}DayZ Launcher${PATH_SEP}Presets`

            window.ipcRenderer.invoke('serverAPI', 'getDirectoryPath', path).then((res: ResData) => {
                resolve(res.data);
            }).catch((error: ResData) => {
                recordLog(error.data, APIError, i18n.global.t('common.appLogType.Error.ApiError')).then(() => {
                    reject(error);
                })
            })

        }).catch((error: ResData) => {
            recordLog(error.data, APIError, i18n.global.t('common.appLogType.Error.ApiError')).then(() => {
                reject(error);
            })
        })
   });
}

export function getPathSep(): Promise<string> {
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((res: ResData) => {
            resolve((res.data));
        });
    });
}

/**
 * 根据id获取配置文件详情
 */
export function getConfigFileById(id: number): Promise<ConfigFile> {
    return new Promise<ConfigFile>((resolve) => {
        selectConfigFileById(id).then((res) => {
            const resData: ResData = transToResData(res);
            resolve(resData.data as ConfigFile);
        })
    });
}

/**
 * 添加配置文件
 */
export function addConfigFile(configFile: ConfigFile): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        insertConfigFile(configFile).then(() => {
            resolve(true);
        })
    })
}

/**
 * 更新配置文件
 */
export function updateConfigFile(configFile: ConfigFile): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        modifyConfigFile(configFile).then(() => {
            resolve(true);
        })
    })
}