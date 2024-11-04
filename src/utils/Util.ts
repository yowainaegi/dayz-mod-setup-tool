import { IPCMAIN_ERROR_PREFIX } from "@/server/models/Constant";
import ResData from "@/server/models/ResData";

/**
 * 获取UUID
 */
export function getUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * 获取日期组成的ID
 */
export function getDateId(): string {
    let date = new Date();
    let res = date.getFullYear()+ '' +
        date.getMonth()+ '' +
        date.getDay()+ '' +
        date.getHours()+ '' +
        date.getMinutes()+ '' +
        date.getMilliseconds();
    return res;
}

/**
 * 深拷贝
 */
export function deepClone(obj: any): any {
    if(typeof obj !== 'object' || obj == null) {
        return obj
    }

    let result: any;
    if(obj instanceof Array) {
        result = []
    } else {
        result = {}
    }

    for(let key in obj) {
        result[key] = deepClone(obj[key])
    }

    return result;
}

/**
 * 转换成ipcmain的错误信息
 */
export function jsonStringfyToIPCMAINError(errRes: ResData): string {
    return `${IPCMAIN_ERROR_PREFIX}${JSON.stringify(errRes)}`;
}