
interface Window {
    // ipcRenderer: Electron.IpcRenderer;
    ipcRenderer: {
        send: Send,
        receive: Receive,
        invoke: Invoke
    }
}


interface Send {
    (channel: any, ...args: any): void
}

interface Receive {
    (channel: any, listener: any): void
}

interface Invoke {
    (channel: any, ...args: any): Promise<any>
}