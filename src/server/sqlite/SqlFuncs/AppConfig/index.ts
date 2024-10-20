/**
 * 根据名称获取APP配置
 */
function selectAppConfigByConfigName(configName: string): Promise<string> {
    let sql = "select id, config_name, config_value from app_config where config_name = ?";
    let params = [configName];
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute','single', sql, params).then((resData: string) => {
            resolve(resData);
        })
    });
}

/**
 * 根据配置名称修改配置值
 */
async function modifyAppConfigByConfigName(configName: string, configValue: any): Promise<string> {
    let sql = "update app_config set config_value = ? where config_name = ?";
    let params = [configValue, configName];
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute', 'edit', sql, params).then((res: string) => {
            resolve(res);
        })
    });
}

export {
    selectAppConfigByConfigName,
    modifyAppConfigByConfigName
}