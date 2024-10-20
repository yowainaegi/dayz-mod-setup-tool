import {getUUID} from "@/utils/Util";
import {now} from "@/utils/DateUtils";
import {i18n} from "@/i18n/index";

export async function recordLog(data: any, typeCode: string, typeText: string) {
    // 保存错误到库中
    let sql = "insert into app_log (id, log_type_code, log_type_text, log_content, log_time, lang) values(?,?,?,?,?,?)"
    let params = [
        getUUID(),
        typeCode,
        typeText,
        data,
        now(),
        i18n.global.locale
    ]
    await window.ipcRenderer.invoke('sqlite3Execute','edit', sql, params)
    // 将日志保存到库中后清空resData
    let resData = {
        statusCode: '500',
        data: null
    }
    return resData;
}