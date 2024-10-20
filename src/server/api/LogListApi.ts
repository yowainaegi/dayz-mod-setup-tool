import AppLog from "@/server/models/AppLog";
import { selectAppLogList } from "@/server/sqlite/SqlFuncs/AppLog";
import { transToResData } from "@/utils/ResUtils";
import ResData from "@/server/models/ResData";

/**
 * 获取所有日志列表
 */
export function getAppLogList(): Promise<AppLog[]> {
    return new Promise<AppLog[]>((resolve) => {
        selectAppLogList().then((res: string) => {
            const resData: ResData = transToResData(res);
            resolve(resData.data as AppLog[]);
        })
    })
}