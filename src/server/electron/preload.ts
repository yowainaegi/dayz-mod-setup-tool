import {contextBridge, ipcRenderer} from "electron";
import ResData from "../models/ResData";
import { STATUS_CODE } from "../models/Constant";

// window.ipcRenderer = ipcRenderer;

// ipc认证方法
const ipc = {
    "render": {
        // From render to main.
        "send": [
            "quitApplication",
            "minimize",
            "maximize",
            "unmaximize",
            "resize"
        ],
        // From main to render. 
        "receive": [
            "changeLang",
            "countFileProgress",
            "resetCountFile",
            "os-service-process-error",
        ],
        // From render to main and back again.
        "invoke": [
            "isMaximized",
            "sqlite3Execute",
            "serverAPI",
            "winInfo",
            "countFiles",
            "copyFolderWithProgress",
            "countFilesInMultipFolder",
            "copyMultipleFolders"
        ]
    }
};

window.ipcRenderer = {
    // From render to main
    send: (channel: any, ...args: any): void => {
        // 获取认证方法数组
        let validChannels = ipc.render.send;
        // 判断方法是否认证
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, ...args);
        }else {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: `include illegal function ${channel}`
            }
            throw new Error(JSON.stringify(resData));
        }
    },
    // From main to render
    receive: (channel: any, listener: any): void => {
        // 获取认证方法数组
        let validChannels = ipc.render.receive;

        // 如果是汇报进度
        if(channel && channel.indexOf('_generateProgress') !== -1) {
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
        // 判断方法是否认证
        else if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }else {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: `include illegal function ${channel}`
            }
            throw new Error(JSON.stringify(resData));
        }
    },
    // From render to main and back again.
    invoke: (channel: any, ...args: any): Promise<any> => {
        // 获取认证方法数组
        let validChannels = ipc.render.invoke;
        return new Promise<any> ((resolve, reject) => {
            // 判断方法是否认证
            if (validChannels.includes(channel)) {
               resolve(ipcRenderer.invoke(channel, ...args));
            } else {
                const resData: ResData = {
                    statusCode: STATUS_CODE.API_ERROR,
                    data: `include illegal function ${channel}`
                }
                reject(JSON.stringify(resData));
            }
        })
    }
};