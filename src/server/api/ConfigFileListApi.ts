import { selectConfigFileList, deleteConfigFileById } from "@/server/sqlite/SqlFuncs/ServerConfigFile";
import ConfigFile from "@/server/models/ServerConfigFile";
import ResData from "../models/ResData";
import { transToResData } from "@/utils/ResUtils";

/**
 * 获取配置文件列表
 */
export function getConfigFileList(): Promise<ConfigFile[]> {
    return new Promise<ConfigFile[]>((resolve) => {
        selectConfigFileList().then((res: string) => {
            const resData: ResData = transToResData(res);
            resolve(resData.data as ConfigFile[])
        })
    }) 
}

/**
 * 根据ID删除配置文件
 */
export function removeConfigFileById(id: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        deleteConfigFileById(id).then(() => {
            resolve(true);
        })
    })
}