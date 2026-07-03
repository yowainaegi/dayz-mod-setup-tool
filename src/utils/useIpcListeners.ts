import { onUnmounted } from "vue";

export default function useIpcListeners() {
    const removeIpcListeners: Array<() => void> = [];

    function receiveIpc(channel: string, listener: (...args: any[]) => void): void {
        const removeListener = window.ipcRenderer.receive(channel, listener);
        removeIpcListeners.push(removeListener);
    }

    function clearIpcListeners(): void {
        removeIpcListeners.forEach((removeListener) => removeListener());
        removeIpcListeners.length = 0;
    }

    onUnmounted(() => {
        clearIpcListeners();
    });

    return {
        receiveIpc,
        clearIpcListeners
    };
}
