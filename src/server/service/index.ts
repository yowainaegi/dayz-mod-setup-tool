import { ipcMain, IpcMainInvokeEvent } from "electron";
import { osServiceHanleMethodMap } from "./OsService";
import { transToResData } from "@/utils/ResUtils";
import fs, { promises as pfs } from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import ResData from "../models/ResData";
import { STATUS_CODE } from "../models/Constant";
import { jsonStringfyToIPCMAINError } from "@/utils/Util";

const handleFunctionsMap = new Map<string, Function>(Object.assign(osServiceHanleMethodMap));

interface CopySource {
    srcPath: string;
    targetPath: string;
}

interface FolderScanResult {
    files: string[];
    folders: string[];
    totalSize: number;
}

ipcMain.handle('serverAPI', (_event, functionName: string, ...params: any) => {
    return new Promise((resolve, reject) => {
        const func = handleFunctionsMap.get(functionName);
        if (func !== undefined) {
            (func as Function)(...params).then((res: string) => {
                const resData = transToResData(res);
                resolve(resData);
            }).catch((error: string) => {
                reject(error);
            });
        } else {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: 'function is undefined'
            };
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
});

async function scanFolder(folder: string): Promise<FolderScanResult> {
    const result: FolderScanResult = {
        files: [],
        folders: [folder],
        totalSize: 0
    };

    const entries = await pfs.readdir(folder, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(folder, entry.name);
        if (entry.isDirectory()) {
            const childResult = await scanFolder(fullPath);
            result.files.push(...childResult.files);
            result.folders.push(...childResult.folders);
            result.totalSize += childResult.totalSize;
        } else if (entry.isFile()) {
            result.files.push(fullPath);
            const fileStat = await pfs.stat(fullPath);
            result.totalSize += fileStat.size;
        }
    }

    return result;
}

async function countFilesInFolder(event: IpcMainInvokeEvent, srcPath: string): Promise<void> {
    const entries = await pfs.readdir(srcPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);
        if (entry.isDirectory()) {
            await countFilesInFolder(event, fullPath);
        } else if (entry.isFile()) {
            await sleep(1);
            event.sender.send('countFileProgress', 1);
        }
    }
}

async function copyFileWithProgress(
    srcPath: string,
    targetPath: string,
    onProgress: (bytesCopied: number, currentSrcPath: string, currentTargetPath: string) => void
): Promise<void> {
    await pfs.mkdir(path.dirname(targetPath), { recursive: true });

    const readStream = fs.createReadStream(srcPath);
    const writeStream = fs.createWriteStream(targetPath);

    readStream.on('data', (chunk) => {
        onProgress(chunk.length, srcPath, targetPath);
    });

    await pipeline(readStream, writeStream);
}

async function copyFoldersWithProgress(
    event: IpcMainInvokeEvent,
    taskId: string,
    sources: CopySource[]
): Promise<void> {
    let totalSize = 0;
    let copiedSize = 0;
    const scanResults: Array<CopySource & FolderScanResult> = [];

    for (const source of sources) {
        const scanResult = await scanFolder(source.srcPath);
        totalSize += scanResult.totalSize;
        scanResults.push({
            ...source,
            ...scanResult
        });
    }

    if (scanResults.length === 0) {
        event.sender.send(`${taskId}_generateProgress`, 100, '', '');
        return;
    }

    for (const source of scanResults) {
        for (const folder of source.folders) {
            const relativeFolderPath = path.relative(source.srcPath, folder);
            await pfs.mkdir(path.join(source.targetPath, relativeFolderPath), { recursive: true });
        }

        if (source.files.length === 0) {
            event.sender.send(`${taskId}_generateProgress`, 100, path.basename(source.srcPath), source.targetPath);
            continue;
        }

        for (const file of source.files) {
            const relativePath = path.relative(source.srcPath, file);
            const targetFilePath = path.join(source.targetPath, relativePath);

            await copyFileWithProgress(file, targetFilePath, (bytesCopied) => {
                copiedSize += bytesCopied;
                const progress = totalSize === 0 ? 100 : (copiedSize / totalSize) * 100;
                event.sender.send(`${taskId}_generateProgress`, progress, path.basename(file), targetFilePath);
            });
        }
    }
}

function createSuccessResData(): ResData {
    return {
        statusCode: STATUS_CODE.SUCCESS,
        data: undefined
    };
}

function createErrorResData(error: any): ResData {
    return {
        statusCode: STATUS_CODE.API_ERROR,
        data: error?.message || error?.toString() || 'unknown error'
    };
}

function rejectWithProcessError(event: IpcMainInvokeEvent, error: any): Promise<never> {
    const resData = createErrorResData(error);
    event.sender.send('os-service-process-error', JSON.stringify(resData));
    return Promise.reject(jsonStringfyToIPCMAINError(resData));
}

ipcMain.handle('countFiles', async (event, srcPath: string) => {
    try {
        await countFilesInFolder(event, srcPath);
        return createSuccessResData();
    } catch (error) {
        const resData = createErrorResData(error);
        throw jsonStringfyToIPCMAINError(resData);
    }
});

ipcMain.handle('copyFolderWithProgress', async (event, taskId: string, srcPath: string, targetPath: string) => {
    event.sender.send('resetCountFile');
    try {
        await copyFoldersWithProgress(event, taskId, [{ srcPath, targetPath }]);
        return createSuccessResData();
    } catch (error) {
        return rejectWithProcessError(event, error);
    }
});

ipcMain.handle('countFilesInMultipFolder', async (event, srcPaths: string[]) => {
    try {
        for (const srcPath of srcPaths) {
            await countFilesInFolder(event, srcPath);
        }
        return createSuccessResData();
    } catch (error) {
        return rejectWithProcessError(event, error);
    }
});

ipcMain.handle('copyMultipleFolders', async (event, taskId: string, srcFolders: string[], targetFolder: string) => {
    event.sender.send('resetCountFile');
    try {
        const sources = srcFolders.map((srcPath) => ({ srcPath, targetPath: targetFolder }));
        await copyFoldersWithProgress(event, taskId, sources);
        return createSuccessResData();
    } catch (error) {
        return rejectWithProcessError(event, error);
    }
});

ipcMain.handle('copyFoldersWithProgress', async (event, taskId: string, sources: CopySource[]) => {
    event.sender.send('resetCountFile');
    try {
        await copyFoldersWithProgress(event, taskId, sources);
        return createSuccessResData();
    } catch (error) {
        return rejectWithProcessError(event, error);
    }
});

function sleep(time: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
}
