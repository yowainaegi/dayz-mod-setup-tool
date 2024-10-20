import {i18n} from "@/i18n/index";

/**
 * 获取所有的APP日志
 */
export function selectAppLogList(): Promise<string> {
    let sql = "select id, log_type_code, log_type_text, log_content, log_time, lang from app_log where lang = ?";
    let params = [i18n.global.locale];

    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute','list', sql, params).then((res: string) => {
            resolve(res);
        })
    })
}