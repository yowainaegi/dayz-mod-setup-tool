import { i18n } from "@/i18n";
import { Modal } from "ant-design-vue";
import { APIError, DataBaseError, UnknownError } from "@/server/constants/LogType";
import ResData from "@/server/models/ResData";
import { STATUS_CODE } from "@/server/models/Constant";
import { getUUID } from "@/utils/Util";
import { now } from "@/utils/DateUtils";
import { transToResData } from "@/utils/ResUtils";

const globalErrorHandler = (error: any) => {
    let err = null;
    if(typeof error === 'string') {
        processAPIError(error);
    } else {
        err = error;
        let resErr: ResData = {
            statusCode: null,
            data: null
        }
        resErr.statusCode = STATUS_CODE.UNKNOWN_ERROR;
        resErr.data = err.message ? err.message : '';
        showPopup(resErr, i18n.global.t('common.modal.error.title.UnknownError'), UnknownError, i18n.global.t('common.appLogType.Error.UnknownError'));
    }
}


function processAPIError(error: string) {
    const err = transToResData(error);

    if(err.statusCode === STATUS_CODE.API_ERROR) {
        showPopup(err, i18n.global.t('common.modal.error.title.ApiError'), APIError, i18n.global.t('common.appLogType.Error.ApiError'));
    } else if(err.statusCode === STATUS_CODE.DATABASE_ERROR) {
        showPopup(err, i18n.global.t('common.modal.error.title.DataBaseError'), DataBaseError, i18n.global.t('common.appLogType.Error.DataBaseError'));
    } else {
        showPopup(err, i18n.global.t('common.modal.error.title.UnknownError'), UnknownError, i18n.global.t('common.appLogType.Error.UnknownError'));
    }
}

const recordLog = (data: any, typeCode: string, typeText: string): Promise<ResData> => {
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
    return new Promise<ResData>((resolve) => {
        window.ipcRenderer.invoke('sqlite3Execute','edit', sql, params).then((res: ResData) => {
            resolve(res);
        })
    })
}

/**
 * 展示弹出框
 */
const showPopup = (error: ResData, title: string, type: string, typeText: string) => {
    console.log(error, title, type, typeText);
    Modal.error({
        centered: true,
        title: () => title,
        content: () => error.data,
        okText: () => i18n.global.t('common.modal.error.ok'),
        onOk: () => {
            return new Promise((resolve) => {
                recordLog(error.data, type , typeText).then((res) => {
                    resolve(res);
                })
            })
        },
    })
}

export {
    globalErrorHandler
}