import ResData from "@/server/models/ResData";
import xml2js, { Builder } from "xml2js";
import { STATUS_CODE } from "@/server/models/Constant";

// 编辑serverDZ.cfg
export function editServerDZCfg(newTemplate: string, serverDZCfgFilePath: string, targetFilePath: string): Promise<void> {
    return new Promise((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSep: ResData) => {
            window.ipcRenderer.invoke('serverAPI', 'getFileContent', serverDZCfgFilePath).then((res: ResData) => {
                let content: string = res.data;

                const regex = /template="([^"]*?)";/;

                const newContent = content.replace(regex, (match, p1) => {
                    return `template = "${newTemplate}";`;
                });
              
                window.ipcRenderer.invoke(
                    'serverAPI', 
                    'overwriteFileContent',
                    newContent,
                    `${targetFilePath}${pathSep.data}serverDZ.cfg`
                ).then(() => {
                    resolve();
                })
            })
        })
    });
}


/**
 * 向cfgeconomycore.xml追加mod配置
 */
export function getCfgeconomycoreXmlContent(cfgeconomycoreXmlPath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        window.ipcRenderer.invoke('serverAPI', 'getFileContent', cfgeconomycoreXmlPath).then((fileContentResData: ResData) => {
            const fileContent = fileContentResData.data;
            const xml2jsParser = new xml2js.Parser()
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
                    resolve(xml2jsResult);
                }
            });
        });
    })
}


/**
 * 将数据写入到 economycore.xml
 */
export function writeObjectToXML(data: any, economycoreXmlPath: string) {
    return new Promise((resolve) => {
        const builder = new Builder();
        const xml = builder.buildObject(data);
        window.ipcRenderer.invoke('serverAPI', 'overwriteFileContent', xml, economycoreXmlPath).then((res: ResData) => {
            resolve(res);
        })
    })
}
        


/**
 * 获取所有xml文件名
 */
export function getConfigFileNameList(path: string): Promise<any[]> {
    return new Promise((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getFileNameList', path).then((res: ResData) => {
            resolve(res.data);
        })
    });
}