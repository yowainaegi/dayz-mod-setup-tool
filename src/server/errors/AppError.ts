import { ERROR_CODES, type AppErrorCode } from "./errorCodes";

interface AppErrorPayload {
    code: AppErrorCode | string;
    params?: Record<string, any>;
    userMessage?: string;
    rawMessage?: string;
    rawStack?: string;
    source?: string;
    cause?: any;
}

class AppError extends Error {
    payload: AppErrorPayload;

    constructor(payload: AppErrorPayload) {
        super(payload.rawMessage || payload.userMessage || payload.code);
        this.name = 'AppError';
        this.payload = payload;
    }
}

function createAppError(
    code: AppErrorCode | string,
    params: Record<string, any> = {},
    options: Partial<Omit<AppErrorPayload, 'code' | 'params'>> = {}
): AppError {
    return new AppError({
        code,
        params,
        ...options,
    });
}

function isAppError(error: any): error is AppError {
    return error instanceof AppError || Boolean(error?.payload?.code);
}

function isAppErrorPayload(value: any): value is AppErrorPayload {
    return value && typeof value === 'object' && typeof value.code === 'string';
}

function createUnknownAppError(error: any, source?: string): AppErrorPayload {
    return {
        code: ERROR_CODES.UNKNOWN,
        rawMessage: error?.message || error?.toString?.() || String(error ?? ''),
        rawStack: error?.stack,
        source,
    };
}

export {
    AppError,
    createAppError,
    createUnknownAppError,
    isAppError,
    isAppErrorPayload,
    type AppErrorPayload
};
