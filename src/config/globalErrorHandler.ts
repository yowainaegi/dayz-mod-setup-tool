import { i18n } from "@/i18n";
import { APIError, DataBaseError, UnknownError } from "@/server/constants/LogType";
import ResData from "@/server/models/ResData";
import { IPCMAIN_ERROR_PREFIX, STATUS_CODE } from "@/server/models/Constant";
import { getUUID } from "@/utils/Util";
import { now } from "@/utils/DateUtils";
import { transToResData } from "@/utils/ResUtils";
import { errorNativeDialog } from "@/utils/nativeDialog";
import { buildLogErrorDetail, formatAppError, getLegacyErrorMessage } from "@/utils/formatAppError";
import { normalizeError } from "@/server/errors/normalizeError";

const globalErrorHandler = (error: any) => {
    if(typeof error === 'string') {
        processErrorMessage(error);
    } else if (error && typeof error === 'object' && 'statusCode' in error) {
        processAPIResData(error as ResData);
    } else {
        try {
            if (error?.message) {
                processErrorMessage(error.message, error);
                return;
            }
            const resErr: ResData = {
                statusCode: STATUS_CODE.UNKNOWN_ERROR,
                data: error,
                error: normalizeError(error, 'renderer')
            };
            showPopup(resErr, i18n.global.t('common.modal.error.title.UnknownError'), UnknownError, i18n.global.t('common.appLogType.Error.UnknownError'));
        } catch (err: any) {
            let resErr: ResData = {
                statusCode: null,
                data: null,
                error: normalizeError(err, 'globalErrorHandler')
            }
            resErr.statusCode = STATUS_CODE.UNKNOWN_ERROR;
            showPopup(resErr, i18n.global.t('common.modal.error.title.UnknownError'), UnknownError, i18n.global.t('common.appLogType.Error.UnknownError'));
        }
    }
}

function processErrorMessage(errorMessage: string, originalError?: any) {
    if(errorMessage.indexOf(IPCMAIN_ERROR_PREFIX) !== -1) {
        const errMsg = errorMessage.substring(errorMessage.indexOf(IPCMAIN_ERROR_PREFIX) + IPCMAIN_ERROR_PREFIX.length);
        processAPIError(errMsg);
        return;
    }

    if (tryProcessResDataJson(errorMessage, originalError)) {
        return;
    }

    const resErr: ResData = {
        statusCode: STATUS_CODE.UNKNOWN_ERROR,
        data: errorMessage,
        error: normalizeError(originalError || new Error(errorMessage), 'renderer')
    };
    showPopup(resErr, i18n.global.t('common.modal.error.title.UnknownError'), UnknownError, i18n.global.t('common.appLogType.Error.UnknownError'));
}

function tryProcessResDataJson(errorMessage: string, originalError?: any): boolean {
    const jsonText = extractResDataJsonText(errorMessage);
    if (!jsonText) {
        return false;
    }

    try {
        const err = transToResData(jsonText);
        if (!err || typeof err !== 'object' || !('statusCode' in err)) {
            return false;
        }
        if (!err.error && err.statusCode !== STATUS_CODE.SUCCESS) {
            err.error = normalizeError(originalError || new Error(errorMessage), 'renderer');
        } else if (err.error && !err.error.rawMessage) {
            err.error.rawMessage = errorMessage;
        }
        processAPIResData(err);
        return true;
    } catch {
        return false;
    }
}

function extractResDataJsonText(errorMessage: string): string | null {
    const trimmedMessage = errorMessage.trim();
    if (trimmedMessage.startsWith('{') && trimmedMessage.endsWith('}')) {
        return trimmedMessage;
    }

    const startIndex = errorMessage.indexOf('{');
    const endIndex = errorMessage.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        return null;
    }

    return errorMessage.substring(startIndex, endIndex + 1);
}

function processAPIError(error: string) {
    const err = transToResData(error);
    processAPIResData(err);
}

function processAPIResData(err: ResData) {
    if (!err.error && err.statusCode !== STATUS_CODE.SUCCESS) {
        err.error = normalizeError(err.data, 'legacy-res-data');
    }

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
    const message = error.error ? formatAppError(error.error) : getLegacyErrorMessage(error.data);
    const logContent = buildLogErrorDetail(error.error, message, error.data);
    errorNativeDialog({
        title,
        message,
        okText: i18n.global.t('common.modal.error.ok'),
    }).then(() => recordLog(logContent, type , typeText));
}

export {
    globalErrorHandler
}
