import type { AppErrorPayload } from "@/server/errors/AppError";

export default interface ResData {
    statusCode: null | string,
    data: null | any,
    error?: AppErrorPayload | null
}
