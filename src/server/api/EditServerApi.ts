import ResData from "@/server/models/ResData";
import ModInfo from "@/server/models/ModInfo";



// 创建服务器profile文件夹
export function createServerProfileFolder(serverFolderPath: string, serverProfileFolderPath: string): Promise<void> {
    return new Promise((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSep: ResData) => {
            const path = `${serverFolderPath}${pathSep.data}${serverProfileFolderPath}`;
            window.ipcRenderer.invoke('serverAPI', 'createServerProfileFolder',path).then(() => {
                resolve();
            });
        })
    })
}




// 编辑启动bat
export async function editStartBatFile(modList: ModInfo[], serverFolderPath: string, serverProfilePath: string, isUpdate: boolean): Promise<void>  {
    return new Promise((resolve) => {

        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSep: ResData) => {
            function process(content: string) {
                // 添加MOD配置
                let addModContent = '';
                for(let i = 0; i < modList.length; i ++) {
                    if(i !== modList.length - 1) {
                        addModContent += `${modList[i].ExtensionPath.substring(modList[i].ExtensionPath.indexOf('@'))};`
                    } else if(isUpdate) {
                        addModContent += `${modList[i].ExtensionPath.substring(modList[i].ExtensionPath.indexOf('@'))};`
                    } else {
                        addModContent += `${modList[i].ExtensionPath.substring(modList[i].ExtensionPath.indexOf('@'))}`
                    }
                }
                let addedModContent = `${content.substring(0, content.indexOf('"-mod=') + '"-mod='.length) + addModContent}`;
                let suffix = content.substring(content.indexOf('"-mod=')+ '"-mod='.length);
                
                content = addedModContent + suffix;

                // 添加cd路径
                addedModContent = `${content.substring(0, content.indexOf('cd') + 'cd'.length)} ${serverFolderPath}\n\n`;
                suffix = content.substring(content.indexOf(':watchdog'));

                content = addedModContent + suffix;
        
                // 添加profile配置
                let profileContent = `${content.substring(0, content.indexOf(' -profiles=') + ' -profiles='.length) + serverProfilePath}`;
                suffix = content.substring(content.indexOf('\necho (%time%) %wat% closed or crashed, restarting.'));
        
                content = profileContent + suffix;

                window.ipcRenderer.invoke(
                    'serverAPI', 
                    'overwriteStartupFileContent',
                    content,
                    `${serverFolderPath}${pathSep.data}startup.bat`
                ).then(() => {
                    resolve();
                })
            }

            if(isUpdate) {
                window.ipcRenderer.invoke('serverAPI', 'getFileContent', `${serverFolderPath + pathSep.data}startup.bat`).then((res: ResData) => {
                    let content: string = res.data;
                    process(content);  
                })
            } else {
                window.ipcRenderer.invoke('serverAPI', 'getStartUpFileContent').then((res: ResData) => {
                    let content: string = res.data;
                    process(content);  
                })
            }
        });
    });
}

// 编辑serverDZ.cfg
export function editServerDZCfg(newHostname: string, serverDZCfgFilePath: string, targetFilePath: string): Promise<void> {
    return new Promise((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((pathSep: ResData) => {
            window.ipcRenderer.invoke('serverAPI', 'getFileContent', serverDZCfgFilePath).then((res: ResData) => {
                let content: string = res.data;

                const regex = /hostname = "([^"]*?)";/;

                const newContent = content.replace(regex, (match, p1) => {
                    return `hostname = "${newHostname}";`;
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
