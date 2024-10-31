import ResData from "@/server/models/ResData";

export function getPathSep(): Promise<string> {
    return new Promise<string>((resolve) => {
        window.ipcRenderer.invoke('serverAPI', 'getPathSep').then((res: ResData) => {
            resolve((res.data));
        });
    });
}

// export function getModPreviewImage(url: string): Promise<string> {
//     return new Promise<string>((resolve) => {
//         window.ipcRenderer.invoke('serverAPI', 'getModPreviewImage', url).then((res: ResData) => {
//             resolve((res.data));
//         });
//     });
// }