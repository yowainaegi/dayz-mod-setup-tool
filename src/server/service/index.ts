import {ipcMain, ipcRenderer} from "electron";
import { osServiceHanleMethodMap } from "./OsService";
import { transToResData } from "@/utils/ResUtils";
import fs, {promises as pfs} from "fs";
import path, { resolve } from "path";
import ResData from "../models/ResData";
import { STATUS_CODE } from "../models/Constant";

// 合并所有的方法
const handleFunctionsMap = new Map<string, Function>(Object.assign(osServiceHanleMethodMap));

ipcMain.handle('serverAPI', (_event, functionName: string, ...params: any) => {
    return new Promise((resolve, reject) => {
        const func = handleFunctionsMap.get(functionName);
        if(func !== undefined) {
            //根据函数名得到函数类型
            (func as Function)(...params).then((res: string) => {
                const resData = transToResData(res);
                resolve(resData);
            }).catch((error: string) => {
                reject(error);
            })
        } else {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: 'function is undefined'
            }
            reject(JSON.stringify(resData));
        }
    })
})


// 获取文件夹中的所有文件
async function getFilesInFolder(folder: string): Promise<string[]> {
   try {
        const entries = await pfs.readdir(folder, { withFileTypes: true });
        const files = await Promise.all(entries.map((entry) => {
        const fullPath = path.join(folder, entry.name);
        if (entry.isDirectory()) {
            return getFilesInFolder(fullPath);
        } else {
            return Promise.resolve([fullPath]);
        }
        }));
        return Array.prototype.concat(...files);
   } catch (err) {
    return Promise.reject(err);
   }
}

// 递归统计单个文件夹的文件数量
async function countFilesInFolder(event: any, srcPath: string): Promise<void> {
    // 读取给定路径的内容
    try {
        const entries = await fs.promises.readdir(srcPath, { withFileTypes: true });
  
        for (const entry of entries) {
            const fullPath = path.join(srcPath, entry.name);
        
            if (entry.isDirectory()) {
                // 如果是文件夹，递归处理该文件夹
                await countFilesInFolder(event, fullPath);
            } else if (entry.isFile()) {
                // 每发现一个文件，实时更新计数
                await sleep(1);
                event.sender.send('countFileProgress', 1);
            }
        }
    } catch (err: any) {
        Promise.reject(err.toString());
    }
}


// 复制文件并监控进度
function copyFileWithProgress(
    srcPath: string,
    targetPath: string,
    onProgress: (bytesCopied: number, currentSrcPath: string, currentTargetPath: string) => void
  ): Promise<void> {

    const resData: ResData = {
        statusCode: null,
        data: null
    }
    
    return new Promise((resolve, reject) => {
      // 确保目标文件夹存在
      fs.mkdir(path.dirname(targetPath), { recursive: true }, (err) => {

        if (err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
            return reject(JSON.stringify(resData));
        };
  
        // 创建读取流和写入流
        const readStream = fs.createReadStream(srcPath);
        const writeStream = fs.createWriteStream(targetPath);
        
        let copiedSize = 0;
  
        // 监听读取流的 'data' 事件
        readStream.on('data', (chunk) => {
          copiedSize += chunk.length;
          onProgress(chunk.length, srcPath, targetPath);  // 更新总进度
        });
  
        readStream.on('error', (err) => {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
            return reject(JSON.stringify(resData));
        });
        writeStream.on('error', (err) => {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
            return reject(JSON.stringify(resData));
        });
  
        // 监听写入流的 'finish' 事件
        writeStream.on('finish', () => {
            writeStream.close(); 
            resolve();
        });
  
        readStream.pipe(writeStream);
      });
    });
}



// 监听从渲染线程传来的countFiles请求
ipcMain.handle('countFiles', (event, srcPath: string) => {
    async function countFiles(srcPath: string) {
        // 读取给定路径的内容
        const entries = await fs.promises.readdir(srcPath, { withFileTypes: true });
            
        // 遍历文件夹中的所有项
        for (const entry of entries) {
            const fullPath = path.join(srcPath, entry.name);

            if (entry.isDirectory()) {
                // 如果是文件夹，则递归计算文件夹中的文件数量
                await countFiles(fullPath);
            } else if (entry.isFile()) {
                // 如果是文件，实时更新文件计数
                await sleep(1);
                event.sender.send('countFileProgress', 1);
            }
        }
    };
    return new Promise((resolve) => {
        countFiles(srcPath).then(() => {
            const resData: ResData = {
                statusCode: null,
                data: undefined
            }
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(resData)
        });
    });
});


// 监听从渲染线程传来的copyFolderWithProgress请求
ipcMain.handle('copyFolderWithProgress', (event, taskId: string, srcPath: string, targetPath: string) => {
    event.sender.send('resetCountFile');
    // 复制文件夹
    async function copyFolderWithProgress(
        taskId: string,
        srcFolder: string, 
        targetFolder: string) {
            // 获取所有文件
            const files = await getFilesInFolder(srcFolder);
            
            // 计算所有文件的总大小
            let totalSize = 0;
            for (const file of files) {
            const fileStat = await pfs.stat(file);
            totalSize += fileStat.size;
            }

            let copiedSize = 0;

            // 开始逐个复制文件
            for (const file of files) {
                const relativePath = path.relative(srcFolder, file);
                const targetPath = path.join(targetFolder, relativePath);

                await copyFileWithProgress(file, targetPath, (bytesCopied) => {
                    copiedSize += bytesCopied;
                    const progress = (copiedSize / totalSize) * 100;
                    event.sender.send(`${taskId}_copyProgress`, progress,  file.substring(file.lastIndexOf(path.sep) + 1), targetPath);
                });
            }
    }
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: undefined
        }
        copyFolderWithProgress(taskId, srcPath, targetPath).then(() => {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(resData);
        }).catch(error => {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            console.log('3')
            event.sender.send('os-service-process-error', JSON.stringify(resData));
        });
    });
});


// 计算多个文件夹中的文件数量
ipcMain.handle('countFilesInMultipFolder', (event, srcPaths: string[]) => {
    const resData: ResData = {
        statusCode: null,
        data: undefined
    }
    return new Promise(async (resolve, reject) => {
        try {
            for (const srcPath of srcPaths) {
                await countFilesInFolder(event, srcPath);
            }
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(resData)
        } catch (err: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.toString();
            console.log('2')
            event.sender.send('os-service-process-error', JSON.stringify(resData));
        }
    })
});


ipcMain.handle('copyMultipleFolders', (event, taskId: string, srcFolders: string[], targetFolder: string) => {
    event.sender.send('resetCountFile');
    async function copyMultipleFolders(srcFolders: string[], targetFolder: string) {
        let totalSize = 0;
        let copiedSize = 0;
    
        // 先计算所有源文件夹中文件的总大小
        for (const srcFolder of srcFolders) {
          const files = await getFilesInFolder(srcFolder);
          for (const file of files) {
            const fileStat = await pfs.stat(file);
            totalSize += fileStat.size;
          }
        }
    
        // 循环复制多个源文件夹中的文件
        for (const srcFolder of srcFolders) {
          const files = await getFilesInFolder(srcFolder);
    
          for (const file of files) {
            const relativePath = path.relative(srcFolder, file);
            const targetPath = path.join(targetFolder, relativePath);
    
            // 复制单个文件并实时更新进度
            await copyFileWithProgress(file, targetPath, (bytesCopied) => {
              copiedSize += bytesCopied;
              const progress = (copiedSize / totalSize) * 100;
              event.sender.send(`${taskId}_copyProgress`, progress, file.substring(file.lastIndexOf(path.sep) + 1), targetPath);
            });
          }
        }
    }
    
    return new Promise((resolve) => {
        const resData: ResData = {
            statusCode: null,
            data: undefined
        }
        copyMultipleFolders(srcFolders, targetFolder).then(() => {   
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(resData)
        }).catch((error) => {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            console.log('1');
            event.sender.send('os-service-process-error', JSON.stringify(resData));
        });
    })
});


function sleep(time: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
}