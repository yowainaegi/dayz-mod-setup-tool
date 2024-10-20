import os from "os";
import fs from "fs";
import {promises as pfs} from "fs";
import path, { resolve } from "path";
import { STATUS_CODE } from "../models/Constant";
import ResData from "../models/ResData";
import { app } from "electron";
import { transToResData } from "@/utils/ResUtils";


/**
 * 系统分隔符
 */
const PATH_SEP = path.sep;

/**
 * 获取系统分隔符
 */
const getPathSep = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        try {
            const resData: ResData = {
                statusCode: STATUS_CODE.SUCCESS,
                data: PATH_SEP
            }
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: error.message
            }
            reject(JSON.stringify(resData));
        }
    });
}

/**
 * 获取系统用户名
 */
const  getOsUserName = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        try {
            const resData: ResData = {
                statusCode: STATUS_CODE.SUCCESS,
                data: os.userInfo().username
            }
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: error.message
            }
            reject(JSON.stringify(resData));
        }
    });
}

/**
 * 获取文件夹路径
 */
const getDirectoryPath = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }
        fs.opendir(path, (err: any, dir: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
                reject(JSON.stringify(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = dir.path;
                dir.close((closeErr: any) => {
                    if(closeErr) {
                        resData.statusCode = STATUS_CODE.API_ERROR;
                        resData.data = closeErr.message;
                    }
                });
                resolve(JSON.stringify(resData));
            }
        })
    })
}

/**
 * 根据文件夹路径获取所有该路径下的文件对象
 */
const getFileNameList = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }

        fs.readdir(path, {encoding: 'utf-8', withFileTypes: true, recursive: false}, (err: any, files: any[]) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
                reject(JSON.stringify(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = files;
                resolve(JSON.stringify(resData));
            }
        });
    })
}

/**
 * 读取文件内容
 */
const getFileContent = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }

        fs.readFile(path, {encoding: 'utf-8'}, (err: any, data: string) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
                reject(JSON.stringify(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = data;
                resolve(JSON.stringify(resData));
            }
        });
    })
}

/**
 * 读取文件内容
 */
const getPictureContent = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }

        fs.readFile(path, (err: any, data: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
                reject(JSON.stringify(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = `data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`;
                resolve(JSON.stringify(resData));
            }
        });
    })
}

/**
 * 读取文件内容
 */
const getPictureContentSync = (path: string): string => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
    const data: any = fs.readFileSync(path);
    resData.statusCode = STATUS_CODE.SUCCESS;
    resData.data = `data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`;
    return JSON.stringify(resData);
}

/**
 * 校验文件夹路径是否正确
 */
const pathValidate = (path: string): Promise<string> => {
    return getDirectoryPath(path);
}

/**
 * 验证路径是否为空
 */
const pathCleanValidate = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }
        fs.readdir(path, {encoding: 'utf-8'}, (err: any, files: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
                reject(JSON.stringify(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                if(files.length > 0) {
                    resData.data = false;
                } else {
                    resData.data = true;
                }
                resolve(JSON.stringify(resData));
            }
        });
    })
}

const getStartUpFileContent = (): Promise<string>  => {
    let START_UP_FILE_PATH = path.join(app.getAppPath(), './bundled/resource/startup.bat');
     // 判断是否是正式环境
     if (app.isPackaged) {
        if(process.platform === 'darwin') {
            // 正式环境
            START_UP_FILE_PATH =  path.join(app.getAppPath(), '..', './resource/startup.bat');
        } else {
            // 正式环境
            START_UP_FILE_PATH =  path.join(path.dirname(app.getPath('exe')), './resources/startup.bat');
        }
    }
    return new Promise((resolve, reject) => {
        getFileContent(START_UP_FILE_PATH).then((fileContentResData: string) => {
            resolve(fileContentResData);
        })
    });
}

const overwriteStartupFileContent = (content: string, targetFilePath: string) : Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
    let START_UP_FILE_PATH = path.join(app.getAppPath(), './bundled/resource/startup.bat');
    // 判断是否是正式环境
    if (app.isPackaged) {
       if(process.platform === 'darwin') {
           // 正式环境
           START_UP_FILE_PATH =  path.join(app.getAppPath(), '..', './resource/startup.bat');
       } else {
           // 正式环境
           START_UP_FILE_PATH =  path.join(path.dirname(app.getPath('exe')), './resources/startup.bat');
       }
   }
   return new Promise((resolve, reject) => {
    
    // 将字符串写入文件
    fs.writeFile(targetFilePath, content, (err) => {
        if (err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
            reject(JSON.stringify(resData));
        } else {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(JSON.stringify(resData));
        }
    });
   });
}

const overwriteFileContent = (content: string, targetFilePath: string) : Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
   return new Promise((resolve, reject) => {
    
    // 将字符串写入文件
    fs.writeFile(targetFilePath, content, (err) => {
        if (err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
            reject(JSON.stringify(resData));
        } else {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(JSON.stringify(resData));
        }
    });
   });
}

const createServerProfileFolder = (serverProfileFolderPath: string) : Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
   return new Promise((resolve, reject) => {

    fs.mkdir(serverProfileFolderPath, {recursive: true}, (err) => {
        if(err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.toString();
            reject(JSON.stringify(resData));
        } else {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(JSON.stringify(resData));
        }
    })
   });
}

// 需要在IPC RENDER 使用 invoke调用的方法
const osServiceHanleMethodMap: Map<string, Function> = new Map();
osServiceHanleMethodMap.set("getPathSep", getPathSep);
osServiceHanleMethodMap.set("getOsUserName", getOsUserName);
osServiceHanleMethodMap.set("getDirectoryPath", getDirectoryPath);
osServiceHanleMethodMap.set("getFileNameList", getFileNameList);
osServiceHanleMethodMap.set("getFileContent", getFileContent);
osServiceHanleMethodMap.set("getPictureContent", getPictureContent);
osServiceHanleMethodMap.set("getPictureContentSync", getPictureContentSync);
osServiceHanleMethodMap.set("pathValidate", pathValidate);
osServiceHanleMethodMap.set("pathCleanValidate", pathCleanValidate);
osServiceHanleMethodMap.set("getStartUpFileContent", getStartUpFileContent);
osServiceHanleMethodMap.set("overwriteFileContent", overwriteFileContent);
osServiceHanleMethodMap.set("overwriteStartupFileContent", overwriteStartupFileContent);
osServiceHanleMethodMap.set("createServerProfileFolder", createServerProfileFolder);


export {
    osServiceHanleMethodMap
}