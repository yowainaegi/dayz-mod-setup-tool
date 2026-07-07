import { AppError, createUnknownAppError, isAppError, isAppErrorPayload, type AppErrorPayload } from "./AppError";
import { ERROR_CODES } from "./errorCodes";
import { IPCMAIN_ERROR_PREFIX, STATUS_CODE } from "@/server/models/Constant";
import type ResData from "@/server/models/ResData";

function getRawMessage(error: any): string {
    return error?.message || error?.toString?.() || String(error ?? '');
}

function tryParseJson(value: string): any | null {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function extractJsonObjectText(message: string): string | null {
    const startIndex = message.indexOf('{');
    const endIndex = message.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        return null;
    }
    return message.substring(startIndex, endIndex + 1);
}

function tryExtractResData(error: any): { resData: ResData; rawMessage: string } | null {
    if (error && typeof error === 'object' && 'statusCode' in error) {
        return {
            resData: error as ResData,
            rawMessage: getRawMessage(error)
        };
    }

    const rawMessage = getRawMessage(error);
    const ipcPrefixIndex = rawMessage.indexOf(IPCMAIN_ERROR_PREFIX);
    const jsonText = ipcPrefixIndex !== -1
        ? rawMessage.substring(ipcPrefixIndex + IPCMAIN_ERROR_PREFIX.length)
        : extractJsonObjectText(rawMessage);

    if (!jsonText) {
        return null;
    }

    const parsed = tryParseJson(jsonText);
    if (!parsed || typeof parsed !== 'object' || !('statusCode' in parsed)) {
        return null;
    }

    return {
        resData: parsed as ResData,
        rawMessage
    };
}

function normalizeResDataError(error: any, source?: string): AppErrorPayload | null {
    const extracted = tryExtractResData(error);
    if (!extracted || extracted.resData.statusCode === STATUS_CODE.SUCCESS) {
        return null;
    }

    const { resData, rawMessage } = extracted;
    if (isAppErrorPayload(resData.error)) {
        return {
            ...resData.error,
            rawMessage: resData.error.rawMessage || rawMessage,
            source: resData.error.source || source,
            cause: resData.error.cause || {
                statusCode: resData.statusCode,
                data: resData.data,
                wrappedMessage: rawMessage
            }
        };
    }

    const nested = normalizeMessageError(resData.data, source);
    if (nested) {
        return {
            ...nested,
            rawMessage,
            cause: {
                statusCode: resData.statusCode,
                data: resData.data
            }
        };
    }

    if (resData.statusCode === STATUS_CODE.DATABASE_ERROR) {
        return {
            code: ERROR_CODES.DATABASE_OPERATION_FAILED,
            rawMessage,
            source,
            cause: {
                statusCode: resData.statusCode,
                data: resData.data
            }
        };
    }

    return null;
}

function extractPathFromMessage(message: string): string | undefined {
    const quotedMatches = [...message.matchAll(/'([^']+)'/g)];
    if (quotedMatches.length > 0) {
        return quotedMatches[quotedMatches.length - 1][1];
    }
    const afterColon = message.split(':').pop()?.trim();
    return afterColon || undefined;
}

function normalizeFileSystemError(error: any, source?: string): AppErrorPayload | null {
    const rawMessage = getRawMessage(error);
    const path = error?.path || extractPathFromMessage(rawMessage);
    const params = path ? { path } : {};
    const errorCode = error?.code
        || rawMessage.match(/\b(ENOENT|EACCES|EPERM|EEXIST|EBUSY|ENOTEMPTY|EINVAL)\b/)?.[1];

    switch (errorCode) {
        case 'ENOENT':
            return { code: ERROR_CODES.PATH_NOT_FOUND, params, rawMessage, rawStack: error?.stack, source };
        case 'EACCES':
        case 'EPERM':
            return { code: ERROR_CODES.PATH_PERMISSION_DENIED, params, rawMessage, rawStack: error?.stack, source };
        case 'EEXIST':
            return { code: ERROR_CODES.PATH_ALREADY_EXISTS, params, rawMessage, rawStack: error?.stack, source };
        case 'EBUSY':
            return { code: ERROR_CODES.PATH_BUSY, params, rawMessage, rawStack: error?.stack, source };
        case 'ENOTEMPTY':
            return { code: ERROR_CODES.DIRECTORY_NOT_EMPTY, params, rawMessage, rawStack: error?.stack, source };
        case 'EINVAL':
            return { code: ERROR_CODES.PATH_INVALID, params, rawMessage, rawStack: error?.stack, source };
        default:
            return null;
    }
}

function normalizeMessageError(error: any, source?: string): AppErrorPayload | null {
    const rawMessage = getRawMessage(error);
    const sourcePresetMatch = rawMessage.match(/source preset does not exist:\s*([^\r\n}]+)/i);
    if (sourcePresetMatch) {
        return {
            code: ERROR_CODES.SOURCE_PRESET_NOT_FOUND,
            params: { path: sourcePresetMatch[1].trim().replace(/^"|"$/g, '') },
            rawMessage,
            rawStack: error?.stack,
            source,
        };
    }

    const activePresetMatch = rawMessage.match(/active preset does not exist:\s*([^\r\n}]+)/i);
    if (activePresetMatch) {
        return {
            code: ERROR_CODES.ACTIVE_PRESET_NOT_FOUND,
            params: { path: activePresetMatch[1].trim().replace(/^"|"$/g, '') },
            rawMessage,
            rawStack: error?.stack,
            source,
        };
    }

    const invalidMissionMatch = rawMessage.match(/^Invalid mission folder:\s*(.+)$/i);
    if (invalidMissionMatch) {
        return {
            code: ERROR_CODES.MISSION_FOLDER_INVALID,
            params: { path: invalidMissionMatch[1] },
            rawMessage,
            rawStack: error?.stack,
            source,
        };
    }

    if (/serverFolderPath is empty/i.test(rawMessage)) {
        return {
            code: ERROR_CODES.SERVER_FOLDER_EMPTY,
            rawMessage,
            rawStack: error?.stack,
            source,
        };
    }

    const unsupportedCeMatch = rawMessage.match(/^Unsupported automatic mount type:\s*(.+)$/i);
    if (unsupportedCeMatch) {
        return {
            code: ERROR_CODES.UNSUPPORTED_CE_TYPE,
            params: { type: unsupportedCeMatch[1] },
            rawMessage,
            rawStack: error?.stack,
            source,
        };
    }

    const xmlRootMatch = rawMessage.match(/^XML root must be <(.+)> to save into (.+)$/i);
    if (xmlRootMatch) {
        return {
            code: ERROR_CODES.XML_ROOT_MISMATCH,
            params: { expected: xmlRootMatch[1], target: xmlRootMatch[2] },
            rawMessage,
            rawStack: error?.stack,
            source,
        };
    }

    return null;
}

function normalizeError(error: any, source?: string): AppErrorPayload {
    if (isAppError(error)) {
        return error instanceof AppError ? error.payload : error.payload;
    }

    const resDataError = normalizeResDataError(error, source);
    if (resDataError) {
        return resDataError;
    }

    const fileSystemError = normalizeFileSystemError(error, source);
    if (fileSystemError) {
        return fileSystemError;
    }

    const messageError = normalizeMessageError(error, source);
    if (messageError) {
        return messageError;
    }

    return createUnknownAppError(error, source);
}

function normalizeDatabaseError(error: any, source?: string): AppErrorPayload {
    return {
        code: ERROR_CODES.DATABASE_OPERATION_FAILED,
        rawMessage: error?.message || error?.toString?.() || String(error ?? ''),
        rawStack: error?.stack,
        source,
    };
}

export {
    normalizeError,
    normalizeDatabaseError
};
