import { i18n } from "@/i18n/index";
import { recordLog } from "@/server/sqlite/SqlFuncs/common/common";
import { APIError } from "@/server/constants/LogType";
import ResData from "@/server/models/ResData";
import { Rule } from "ant-design-vue/lib/form";

/**
 * 纯净服务器文件夹路路径validate
 */
export function pureServerFolderPathValidate(_rule: Rule, value: string) {
    return pathCleanValidate(value);
}

/**
 * 服务器文件夹路径validate
 */
export function serverFolderPathValidate(_rule: Rule, value: string) {
    return pathCleanValidate(value);
}

// 校验是否包含特殊字符
export function containsSpecialCharacters(_rule: Rule, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>/]/;
        const res = specialCharPattern.test(value);
        if(res) {
            reject('has special letters')   
        } else {
            resolve();
        }
    })
}

/**
 * 路径validate
 */
function pathValidate(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if(path) {
            window.ipcRenderer.invoke('serverAPI', 'pathValidate' , path).then((res: ResData) => {
                resolve();
            }).catch((error: ResData) => {
                reject(error.data);
            })
        } else {
            reject('pathValidate function path is required');
        }
    })
}

/**
 * 路径目录是否干净validate
 */
function pathCleanValidate(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if(path) {
            window.ipcRenderer.invoke('serverAPI', 'pathCleanValidate', path).then((res: ResData) => {
                resolve();
            }).catch((error: ResData) => {
                reject(error.data);
            })
        } else {
            const message = 'pathCleanValidate function path is required';
            recordLog(message, APIError, i18n.global.t('common.appLogType.Error.ApiError')).then(() => {
                reject(message);
            })
        }
    })
}