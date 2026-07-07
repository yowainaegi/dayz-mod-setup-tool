import { i18n } from "@/i18n";
import { ERROR_CODES } from "@/server/errors/errorCodes";
import { isAppErrorPayload, type AppErrorPayload } from "@/server/errors/AppError";

function interpolate(template: string, params: Record<string, any> = {}): string {
    return template.replace(/\{(\w+)\}/g, (_match, key) => {
        const value = params[key];
        return value === undefined || value === null ? '' : String(value);
    }).replace(/[：:]\s*$/g, '');
}

function getLegacyErrorMessage(errorData: any): string {
    if (typeof errorData === 'string') {
        return errorData;
    }
    if (isAppErrorPayload(errorData)) {
        return formatAppError(errorData);
    }
    return errorData?.message || errorData?.toString?.() || String(errorData ?? '');
}

function formatAppError(error: AppErrorPayload | null | undefined): string {
    if (!error) {
        return i18n.global.t(`common.errors.${ERROR_CODES.UNKNOWN}`);
    }
    if (error.userMessage) {
        return error.userMessage;
    }

    const key = `common.errors.${error.code}`;
    const translated = i18n.global.t(key);
    if (translated && translated !== key) {
        return interpolate(translated, error.params);
    }

    const fallback = i18n.global.t(`common.errors.${ERROR_CODES.UNKNOWN}`);
    return fallback === `common.errors.${ERROR_CODES.UNKNOWN}` ? (error.rawMessage || error.code) : fallback;
}

function buildLogErrorDetail(error: AppErrorPayload | null | undefined, dialogMessage: string, legacyData?: any): string {
    if (!error) {
        const rawMessage = getLegacyErrorMessage(legacyData);
        return JSON.stringify({
            message: rawMessage,
            dialogMessage,
            rawMessage,
            legacyData,
        }, null, 2);
    }

    const rawMessage = error.rawMessage || getLegacyErrorMessage(legacyData) || dialogMessage;
    return JSON.stringify({
        message: rawMessage,
        code: error.code,
        dialogMessage,
        params: error.params,
        source: error.source,
        rawMessage,
        rawStack: error.rawStack,
        cause: error.cause,
        legacyData,
    }, null, 2);
}

export {
    formatAppError,
    buildLogErrorDetail,
    getLegacyErrorMessage
};
