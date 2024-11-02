import os from "os";
import fs from "fs";
import path from "path";
import { STATUS_CODE } from "../models/Constant";
import ResData from "../models/ResData";
import { app } from "electron";
// import puppeteer from "puppeteer";


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
            // 获取用户本地应用数据目录 (C:\Users\用户名\AppData\Local\软件名)
            const userDataPath = app.getPath('userData');

            // 设置数据库路径为：C:\Users\用户名\AppData\Local\软件名\startup.bat
            START_UP_FILE_PATH = path.join(userDataPath, 'startup.bat');    
            if (!fs.existsSync(START_UP_FILE_PATH)) {
                // 如果不存在，复制文件到
                const startupFilePath = path.join(process.resourcesPath, 'startup.bat');
                fs.copyFileSync(startupFilePath, START_UP_FILE_PATH);
            }
        }
    }
    return new Promise((resolve) => {
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

const createModConfigFolders = (targetPath: string, folders: string[]) => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
   return new Promise((resolve, reject) => {
    for(let folder of folders) {
        try {
            const willBeCreatePath = `${targetPath}${path.sep}${folder}`;
            fs.mkdirSync(willBeCreatePath, {recursive: true});
        } catch (err: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.toString();
            reject(JSON.stringify(resData));
        }
    }
    resData.statusCode = STATUS_CODE.SUCCESS;
    resolve(JSON.stringify(resData));
   });
}

/**
 * get previewImage from net
 */
// const getModPreviewImage = (url: string): Promise<string> => {
//     const resData: ResData = {
//         statusCode: null,
//         data: null
//     }
//     return new Promise<string>(async (resolve, reject) => {
//         try {
//             // 启动浏览器
//             const browser = await puppeteer.launch({
//                 headless: true, // 设置为true以无头模式运行，false则可以看到浏览器窗口
//                 args: ['--no-sandbox', '--disable-setuid-sandbox'],
//                 defaultViewport: { width: 2560, height: 1440 } // 设置默认视口大小
//             });

//             // 创建新页面
//             const page = await browser.newPage();

//             // 导航到目标页面
//             await page.goto(url, { waitUntil: 'networkidle2' }); // 等待页面加载完成

//             // 抓取页面内容
//             let content = await page.content();
//             content = content.substring(content.indexOf(`<img id="previewImageMain" class="workshopItemPreviewImageMain" src="`), content.lastIndexOf(`<span class="zoom-icon">`));
//             let previewImageUrl =content.substring(content.indexOf("src=\"") + 5, content.lastIndexOf("\""));
//             // 关闭浏览器
//             await browser.close();
//             resData.statusCode = STATUS_CODE.SUCCESS;
//             resData.data = previewImageUrl;
//             resolve(JSON.stringify(resData));
//         } catch (err: any) {
//             resData.statusCode = STATUS_CODE.API_ERROR;
//             resData.data = err.toString();
//             reject(JSON.stringify(resData));
//         }
//     })
// }


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
osServiceHanleMethodMap.set("createModConfigFolders", createModConfigFolders);
// osServiceHanleMethodMap.set("getModPreviewImage", getModPreviewImage);


export {
    osServiceHanleMethodMap
}