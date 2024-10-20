import ResData from "@/server/models/ResData";

/**
 * 将返回结果转换成ResData
 */
export function transToResData(param: string): ResData {
    return JSON.parse(param) as ResData;
}