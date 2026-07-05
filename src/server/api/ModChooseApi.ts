import ModInfo from "@/server/models/ModInfo";
import ResData from "@/server/models/ResData";
import { MOD_BE_SEARCHE_STATUS, MOD_LIST_TYPE, STATUS_CODE } from "@/server/models/Constant";
import xml2js  from "xml2js";

/**
 * 获取模组信息
 */
export function getModList(): Promise<ModInfo[]> {
  return new Promise<ModInfo[]>((resolve) => {
    window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSepData: ResData) => {
        const PATH_SEP = pathSepData.data;
        window.ipcRenderer.invoke('serverAPI', 'getOsUserName').then((osUserNameResData: ResData) => {
            const osUsername = osUserNameResData.data;
            let path = `C:${PATH_SEP}Users${PATH_SEP}${osUsername}${PATH_SEP}AppData${PATH_SEP}Local${PATH_SEP}DayZ Launcher${PATH_SEP}Steam.json`;
            window.ipcRenderer.invoke('serverAPI', 'getFileContent', path).then(async (fileContentResData: ResData) => {
                const fileContent = fileContentResData.data;
                const steamjsonObj: any = JSON.parse(fileContent);
                const modInfoList: ModInfo[] = steamjsonObj.Extensions;
                for(let i = 0; i < modInfoList.length; i ++) {
                    modInfoList[i].key = modInfoList[i].Id;
                    modInfoList[i].AddedStatus = MOD_LIST_TYPE.SUBSCRIBED;
                    modInfoList[i].SearchedStatus = MOD_BE_SEARCHE_STATUS.SEARCHED;
                    modInfoList[i].CanBeRemovedDZMSUTool = true;
                    let cachedPreviewImageObj = modInfoList[i].StorageInfo.CachedPreviewImage;
                    if(cachedPreviewImageObj) {
                        const pictureContentResData = await window.ipcRenderer.invoke('serverAPI', 'getPictureContent', cachedPreviewImageObj.FullPath);
                        modInfoList[i].previewImageMain = pictureContentResData.data;
                    }
                    let modFolderName = `${modInfoList[i].Id.substring(modInfoList[i].Id.indexOf("steam:") + "steam:".length)}-@${modInfoList[i].DisplayName}`;
                    modInfoList[i].modFolderName = modFolderName;
                    modInfoList[i].isMapMod = false;
                }
                resolve(modInfoList); 
            });
        });
    });
  });
}

/**
 * 获取预设文件模组信息
 */
export function getModIdListByServerConfigFile(presetFilePath: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        window.ipcRenderer.invoke('serverAPI', 'getFileContent', presetFilePath).then((fileContentResData: ResData) => {
            const fileContent = fileContentResData.data;
            const xml2jsParser = new xml2js.Parser({
                tagNameProcessors: [renameTag]
            })
            xml2jsParser.parseString(fileContent, (err: Error | null, xml2jsResult: any) => {
                if(err) {
                    const resData: ResData = {
                        statusCode: null,
                        data: null
                    }
                    resData.statusCode = STATUS_CODE.API_ERROR;
                    resData.data = err.message;
                    reject(JSON.stringify(resData));
                } else {
                    resolve(parsePresetModIds(xml2jsResult))
                }
            });
        }).catch((error: ResData) => {
            reject(error);
        });
    })
}

export function saveModIdListToPresetFile(presetFilePath: string, modIdList: string[]): Promise<void> {
    const normalizedIds = Array.from(new Set(modIdList.map((id) => id.startsWith('steam:') ? id.substring('steam:'.length) : id)));
    const publishedIdsXml = [
        '  <published-ids>',
        ...normalizedIds.map((id) => `    <id>${id}</id>`),
        '  </published-ids>'
    ].join('\n');

    return new Promise<void>((resolve, reject) => {
        window.ipcRenderer.invoke('serverAPI', 'getFileContent', presetFilePath).then((fileContentResData: ResData) => {
            const fileContent = fileContentResData.data as string;
            let nextContent = '';
            if (/<published-ids>[\s\S]*?<\/published-ids>/i.test(fileContent)) {
                nextContent = fileContent.replace(/<published-ids>[\s\S]*?<\/published-ids>/i, publishedIdsXml);
            } else {
                nextContent = fileContent.replace(/<\/addons-presets>/i, `${publishedIdsXml}\n</addons-presets>`);
            }

            window.ipcRenderer.invoke('serverAPI', 'overwriteFileContent', nextContent, presetFilePath)
                .then(() => resolve())
                .catch((error: ResData) => reject(error));
        }).catch((error: ResData) => {
            reject(error);
        });
    });
}

function parsePresetModIds(xml2jsResult: any): string[] {
    const publishedIds = toArray(xml2jsResult?.addonsPresets?.publishedIds);
    const rawIdList = publishedIds.flatMap((publishedId: any) => toArray(publishedId?.id));
    const normalizedIdList = rawIdList
        .map((id: any) => normalizeSteamId(id))
        .filter((id: string | null): id is string => id !== null);

    return Array.from(new Set(normalizedIdList));
}

function normalizeSteamId(id: any): string | null {
    if (typeof id !== 'string' && typeof id !== 'number') {
        return null;
    }

    const idText = String(id).trim();
    if (idText.length === 0) {
        return null;
    }

    return idText.startsWith('steam:') ? idText : `steam:${idText}`;
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
    if (value === null || value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}


/**
 * 自定义标签转换函数
 * @param name
 */
function renameTag(name: string): string {
    const tagMap: Map<string,string> = new Map();
    tagMap.set('addons-presets', 'addonsPresets')
    tagMap.set('last-update', 'lastUpdate');
    tagMap.set('published-ids', 'publishedIds');
    return tagMap.get(name) || name; // 如果没有映射就返回原标签名
 };
