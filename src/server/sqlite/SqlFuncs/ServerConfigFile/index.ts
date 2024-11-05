import ConfigFile from "@/server/models/ServerConfigFile";

export function selectConfigFileList(): Promise<string> {
    const sql = "select id, server_id, server_name, config_file_name, pure_server_folder_path, server_folder_path, deploy_server_folder_path, preset_file_name, server_profile_folder, server_map_mission_path from server_config_file"
    return new Promise((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute','list', sql, []).then((res: string) => {
            resolve(res);
        })
    })
}

export function selectConfigFileById(id: number): Promise<string> {
    let sql = "select id, server_id, server_name, config_file_name, pure_server_folder_path, server_folder_path, deploy_server_folder_path, preset_file_name, server_profile_folder, server_map_mission_path from server_config_file where id = ?"
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute','single', sql, [id]).then((res: string) => {
            resolve(res);
        })
    })
}

/**
 * 保存配置文件
 * @param configFile 配置文件对象
 * @returns 保存结果
 */
export function insertConfigFile(configFile: ConfigFile): Promise<string> {
    let sql = "insert into server_config_file (server_id, server_name, config_file_name, pure_server_folder_path, server_folder_path, deploy_server_folder_path, preset_file_name, server_profile_folder) values (?, ?, ?, ?, ?, ?, ?, ?)"
    let params:any[] = []
    params.push(configFile.server_id)
    params.push(configFile.server_name)
    params.push(configFile.config_file_name)
    params.push(configFile.pure_server_folder_path)
    params.push(configFile.server_folder_path)
    params.push(configFile.deploy_server_folder_path)
    params.push(configFile.preset_file_name)
    params.push(configFile.server_profile_folder)
    
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute', 'edit', sql, params).then((res: string) => {
            resolve(res);
        })
    });
}

/**
 * 更新配置文件
 * @param configFile 配置文件对象
 * @returns 更新结果
 */
export function modifyConfigFile(configFile: ConfigFile): Promise<string> {
    let sql = "update server_config_file set server_id = ?, server_name = ?, config_file_name = ?, pure_server_folder_path = ?, server_folder_path = ?, deploy_server_folder_path = ?, preset_file_name = ?, server_profile_folder = ? where id = ?"
    let params: any[] = []
    params.push(configFile.server_id)
    params.push(configFile.server_name)
    params.push(configFile.config_file_name)
    params.push(configFile.pure_server_folder_path)
    params.push(configFile.server_folder_path)
    params.push(configFile.deploy_server_folder_path)
    params.push(configFile.preset_file_name)
    params.push(configFile.server_profile_folder)
    params.push(configFile.id)
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute', 'edit', sql, params).then((res: string) => {
            resolve(res);
        })
    });
}

/**
 * 更新配置文件_根据id更新地图路径
 * @returns 更新结果
 */
export function modifyMapMissionPathByServerId(serverId: string, mapMissionPath: string): Promise<string> {
    let sql = "update server_config_file set server_map_mission_path = ? where server_id = ?"
    let params: any[] = []
    params.push(mapMissionPath)
    params.push(serverId)
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute', 'edit', sql, params).then((res: string) => {
            resolve(res);
        })
    });
}

/**
 * 根据配置文件删除
 */
export function deleteConfigFileById(id: number): Promise<string> {
    let sql = "delete from server_config_file where id = ?"
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute', 'edit', sql, [id]).then((res: string) => {
            resolve(res);
        })
    })
}
