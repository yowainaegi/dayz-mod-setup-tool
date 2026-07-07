import {app, BrowserWindow, dialog, ipcMain, nativeImage, shell} from "electron";
import fs from "fs";
import path from "path";
import { appThemeTokens } from "@/styles/antdTheme";
const isDevelopment = !app.isPackaged;
const TEXT_FILE_PREVIEW_MAX_BYTES = 2 * 1024 * 1024;

interface AppDialogOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message?: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

interface AppDialogResult {
  response: number;
}

interface TextFilePreviewData {
  title: string;
  filePath: string;
  content: string;
  isTruncated: boolean;
  serverFolderPath?: string;
  modFolderName?: string;
  selectedType?: string;
  saveSourcePath?: string;
  error?: string;
}

interface TextFileEditorData extends TextFilePreviewData {
  serverFolderPath: string;
  modFolderName: string;
  selectedType?: string;
}

// nodejs服务端API
import "@/server/service/index";
// db操作API
import "@/server/sqlite/index";

let win: BrowserWindow;
let winDefaultPosition: number[];
const dialogOptionsByWebContentsId = new Map<number, Required<AppDialogOptions>>();
const textFilePreviewByWebContentsId = new Map<number, TextFilePreviewData>();
const textFileEditorByWebContentsId = new Map<number, TextFileEditorData>();

const mainWindowSize = {
  width: 1180,
  height: 720,
  minWidth: 1040,
  minHeight: 640,
} as const;

const dialogWindowSize = {
  width: 360,
  height: 176,
} as const;

const textFilePreviewWindowSize = {
  width: 760,
  height: 540,
  minWidth: 560,
  minHeight: 380,
} as const;

const textFileEditorWindowSize = {
  width: 820,
  height: 600,
  minWidth: 640,
  minHeight: 460,
} as const;

function disableBrowserShortcuts(browserWindow: BrowserWindow) {
  browserWindow.on('app-command', (event, command) => {
    if (command === 'browser-backward' || command === 'browser-forward') {
      event.preventDefault();
    }
  });

  browserWindow.on('enter-full-screen', () => {
    if (!browserWindow.isDestroyed()) {
      browserWindow.setFullScreen(false);
    }
  });

  browserWindow.webContents.on('zoom-changed', (event) => {
    event.preventDefault();
    browserWindow.webContents.setZoomFactor(1);
  });

  browserWindow.webContents.setVisualZoomLevelLimits(1, 1).catch(() => undefined);

  browserWindow.webContents.on('before-input-event', (event, input) => {
    const isBrowserHistoryKey = input.key === 'BrowserBack' || input.key === 'BrowserForward';
    const isAltArrowHistory = input.alt && ['ArrowLeft', 'ArrowRight', 'Left', 'Right'].includes(input.key);
    const normalizedKey = input.key.toLowerCase();
    const isFullScreenKey = input.key === 'F11';
    const isZoomKey = input.control
      && !input.alt
      && ['+', '=', '-', '_', '0', 'numadd', 'numsub', 'numpadadd', 'numpadsubtract', 'add', 'subtract'].includes(normalizedKey);

    if (isBrowserHistoryKey || isAltArrowHistory || isFullScreenKey || isZoomKey) {
      event.preventDefault();
    }
  });
}

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: mainWindowSize.width,
    height: mainWindowSize.height,
    resizable: true,
    show: false,
    frame: false,
    hasShadow: true,
    thickFrame: true,
    minWidth: mainWindowSize.minWidth,
    minHeight: mainWindowSize.minHeight,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    },
  });
  disableBrowserShortcuts(win);

  if (process.env.ELECTRON_RENDERER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    // Load the index.html when not in development
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  if(isDevelopment) {
    const appIcon = nativeImage.createFromPath(path.join(__dirname, '../../public/app-icons/icons/512x512.png'))
    win.setIcon(appIcon)
    if(process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(appIcon)
    }
  }

  // 避免白屏
  win.once('ready-to-show', () => {
    win.setHasShadow(true);
    win.show();
    // 记住win的位置
    winDefaultPosition = win.getPosition();
  })

  // win窗体大小重置监听
  win.on("resize", () => {
    const isMaximize = win.isMaximized();
    const [winWidth, winHeight] = win.getSize();
    win.webContents.send("winInfo", {screenWidth: winWidth, screenHeight: winHeight, isMaximize: isMaximize});
  })
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

/* ipcMain处理事件 开始 */
// 退出程序
ipcMain.on('quitApplication', (event, message) => {
  // closeConnection(()=> {
  //     app.quit()
  // })
  app.quit();
})

// 最小化
ipcMain.on('minimize', (_event, _message) => {
  win.minimize();
})

// 最大化
ipcMain.on('maximize', (_event, _message) => {
  win.maximize();
})

// 关闭最大化
ipcMain.on('unmaximize', (_event, _message) => {
  win.unmaximize();
})

// 重置窗体大小
ipcMain.on('resize', (_event, _message) => {
  win.unmaximize();
  win.setSize(mainWindowSize.width, mainWindowSize.height);
  win.setPosition(winDefaultPosition[0], winDefaultPosition[1]);
})

// 获取窗体大小
ipcMain.handle('winInfo', (_event, _message) => {
  const isMaximize = win.isMaximized();
  const [winWidth, winHeight] = win.getSize();
  return {screenWidth: winWidth, screenHeight: winHeight, isMaximize: isMaximize};
})

// 是否最大化
ipcMain.handle('isMaximized', (_event) => {
  return win.isMaximized();
})

ipcMain.handle('showNativeDialog', async (_event, options: AppDialogOptions): Promise<AppDialogResult> => {
  const dialogOptions: Required<AppDialogOptions> = {
    type: options?.type ?? 'none',
    title: options?.title ?? app.name,
    message: options?.message ?? options?.title ?? '',
    detail: options?.detail ?? '',
    buttons: options?.buttons ?? ['OK'],
    defaultId: options?.defaultId ?? 0,
    cancelId: options?.cancelId ?? 0,
  };

  return new Promise<AppDialogResult>((resolve) => {
    const parentWindow = win && !win.isDestroyed() ? win : undefined;
    const dialogWidth = dialogWindowSize.width;
    const dialogHeight = dialogWindowSize.height;
    const parentBounds = parentWindow?.getBounds();
    const dialogPosition = parentBounds
      ? {
          x: Math.round(parentBounds.x + (parentBounds.width - dialogWidth) / 2),
          y: Math.round(parentBounds.y + (parentBounds.height - dialogHeight) / 2),
        }
      : undefined;
    const dialogWindow = new BrowserWindow({
      width: dialogWidth,
      height: dialogHeight,
      minWidth: dialogWindowSize.width,
      minHeight: dialogWindowSize.height,
      x: dialogPosition?.x,
      y: dialogPosition?.y,
      parent: parentWindow,
      modal: true,
      show: false,
      frame: false,
      hasShadow: true,
      thickFrame: true,
      resizable: true,
      minimizable: false,
      maximizable: true,
      fullscreenable: false,
      backgroundColor: appThemeTokens.colorBgContent,
      title: dialogOptions.title,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload/preload.js")
      },
    });
    disableBrowserShortcuts(dialogWindow);

    let resolved = false;
    const webContentsId = dialogWindow.webContents.id;
    const responseChannel = `app-dialog-response-${webContentsId}`;
    dialogOptionsByWebContentsId.set(webContentsId, dialogOptions);

    const finish = (response: number) => {
      if (resolved) {
        return;
      }
      resolved = true;
      dialogOptionsByWebContentsId.delete(webContentsId);
      ipcMain.removeListener(responseChannel, handleDialogResponse);
      resolve({ response });
      if (!dialogWindow.isDestroyed()) {
        dialogWindow.close();
      }
    };

    const handleDialogResponse = (_responseEvent: Electron.IpcMainEvent, response: number) => {
      finish(response);
    };

    dialogWindow.once('ready-to-show', () => {
      dialogWindow.setHasShadow(true);
      dialogWindow.show();
    });
    dialogWindow.on('closed', () => finish(dialogOptions.cancelId));

    ipcMain.once(responseChannel, handleDialogResponse);

    if (process.env.ELECTRON_RENDERER_URL) {
      dialogWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/Dialog`);
    } else {
      dialogWindow.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: 'Dialog' });
    }
  });
})

ipcMain.handle('showOpenDirectoryDialog', async (_event, title?: string): Promise<string | null> => {
  const parentWindow = win && !win.isDestroyed() ? win : undefined;
  const options: Electron.OpenDialogOptions = {
    title: title || 'Select Folder',
    properties: ['openDirectory']
  };
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
})

ipcMain.handle('getNativeDialogOptions', (event) => {
  return dialogOptionsByWebContentsId.get(event.sender.id);
})

ipcMain.handle('closeNativeDialog', (event, response: number) => {
  ipcMain.emit(`app-dialog-response-${event.sender.id}`, event, response);
})

/* ipcMain处理事件 结束 */

async function readTextFilePreviewData(
  filePath: string,
  title?: string,
  metadata?: Partial<TextFilePreviewData>
): Promise<TextFilePreviewData> {
  const previewTitle = title || path.basename(filePath);
  try {
    const stats = await fs.promises.stat(filePath);
    const fileHandle = await fs.promises.open(filePath, 'r');
    try {
      const readLength = Math.min(stats.size, TEXT_FILE_PREVIEW_MAX_BYTES);
      const buffer = Buffer.alloc(readLength);
      await fileHandle.read(buffer, 0, readLength, 0);
      return {
        ...metadata,
        title: previewTitle,
        filePath,
        content: buffer.toString('utf-8'),
        isTruncated: stats.size > TEXT_FILE_PREVIEW_MAX_BYTES,
      };
    } finally {
      await fileHandle.close();
    }
  } catch (error: any) {
    return {
      ...metadata,
      title: previewTitle,
      filePath,
      content: '',
      isTruncated: false,
      error: error?.message || error?.toString() || 'Failed to read file',
    };
  }
}

ipcMain.handle('showTextFilePreview', async (
  _event,
  filePath: string,
  title?: string,
  serverFolderPath?: string,
  modFolderName?: string,
  selectedType?: string,
  saveSourcePath?: string
) => {
  const parentWindow = win && !win.isDestroyed() ? win : undefined;
  const previewWidth = textFilePreviewWindowSize.width;
  const previewHeight = textFilePreviewWindowSize.height;
  const parentBounds = parentWindow?.getBounds();
  const previewPosition = parentBounds
    ? {
        x: Math.round(parentBounds.x + (parentBounds.width - previewWidth) / 2),
        y: Math.round(parentBounds.y + (parentBounds.height - previewHeight) / 2),
      }
    : undefined;
  const previewWindow = new BrowserWindow({
    width: previewWidth,
    height: previewHeight,
    x: previewPosition?.x,
    y: previewPosition?.y,
    minWidth: textFilePreviewWindowSize.minWidth,
    minHeight: textFilePreviewWindowSize.minHeight,
    parent: parentWindow,
    modal: false,
    show: false,
    frame: false,
    hasShadow: true,
    thickFrame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    backgroundColor: appThemeTokens.colorBgContent,
    title: title || path.basename(filePath),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    },
  });
  disableBrowserShortcuts(previewWindow);

  const webContentsId = previewWindow.webContents.id;
  textFilePreviewByWebContentsId.set(webContentsId, await readTextFilePreviewData(filePath, title, {
    serverFolderPath,
    modFolderName,
    selectedType,
    saveSourcePath,
  }));

  previewWindow.once('ready-to-show', () => {
    previewWindow.setHasShadow(true);
    previewWindow.show();
  });
  previewWindow.on('closed', () => {
    textFilePreviewByWebContentsId.delete(webContentsId);
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await previewWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/TextFilePreview`);
  } else {
    await previewWindow.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: 'TextFilePreview' });
  }

  return true;
})

ipcMain.handle('getTextFilePreviewData', (event) => {
  return textFilePreviewByWebContentsId.get(event.sender.id);
})

ipcMain.handle('closeTextFilePreview', (event) => {
  const previewWindow = BrowserWindow.fromWebContents(event.sender);
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
  }
})

ipcMain.handle('showTextFilePreviewInFolder', (event) => {
  const previewData = textFilePreviewByWebContentsId.get(event.sender.id);
  if (previewData?.filePath) {
    shell.showItemInFolder(previewData.filePath);
  }
})

ipcMain.handle('showTextFileEditor', async (
  _event,
  filePath: string,
  title: string | undefined,
  serverFolderPath: string,
  modFolderName: string,
  selectedType?: string,
  saveSourcePath?: string
) => {
  const parentWindow = win && !win.isDestroyed() ? win : undefined;
  const editorWidth = textFileEditorWindowSize.width;
  const editorHeight = textFileEditorWindowSize.height;
  const parentBounds = parentWindow?.getBounds();
  const editorPosition = parentBounds
    ? {
        x: Math.round(parentBounds.x + (parentBounds.width - editorWidth) / 2),
        y: Math.round(parentBounds.y + (parentBounds.height - editorHeight) / 2),
      }
    : undefined;
  const editorWindow = new BrowserWindow({
    width: editorWidth,
    height: editorHeight,
    x: editorPosition?.x,
    y: editorPosition?.y,
    minWidth: textFileEditorWindowSize.minWidth,
    minHeight: textFileEditorWindowSize.minHeight,
    parent: parentWindow,
    modal: false,
    show: false,
    frame: false,
    hasShadow: true,
    thickFrame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    backgroundColor: appThemeTokens.colorBgContent,
    title: title || path.basename(filePath),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    },
  });
  disableBrowserShortcuts(editorWindow);

  const webContentsId = editorWindow.webContents.id;
  textFileEditorByWebContentsId.set(webContentsId, await readTextFilePreviewData(filePath, title, {
    serverFolderPath,
    modFolderName,
    selectedType,
    saveSourcePath,
  }) as TextFileEditorData);

  editorWindow.once('ready-to-show', () => {
    editorWindow.setHasShadow(true);
    editorWindow.show();
  });
  editorWindow.on('closed', () => {
    textFileEditorByWebContentsId.delete(webContentsId);
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await editorWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/TextFileEditor`);
  } else {
    await editorWindow.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: 'TextFileEditor' });
  }

  return true;
})

ipcMain.handle('minimizeTextFilePreview', (event) => {
  const previewWindow = BrowserWindow.fromWebContents(event.sender);
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.minimize();
  }
})

ipcMain.handle('toggleMaximizeTextFilePreview', (event) => {
  const previewWindow = BrowserWindow.fromWebContents(event.sender);
  if (!previewWindow || previewWindow.isDestroyed()) {
    return false;
  }
  if (previewWindow.isMaximized()) {
    previewWindow.unmaximize();
    return false;
  }
  previewWindow.maximize();
  return true;
})

ipcMain.handle('isTextFilePreviewMaximized', (event) => {
  const previewWindow = BrowserWindow.fromWebContents(event.sender);
  return previewWindow && !previewWindow.isDestroyed() ? previewWindow.isMaximized() : false;
})

ipcMain.handle('getTextFileEditorData', (event) => {
  return textFileEditorByWebContentsId.get(event.sender.id);
})

ipcMain.handle('closeTextFileEditor', (event) => {
  const editorWindow = BrowserWindow.fromWebContents(event.sender);
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.close();
  }
})

ipcMain.handle('minimizeTextFileEditor', (event) => {
  const editorWindow = BrowserWindow.fromWebContents(event.sender);
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.minimize();
  }
})

ipcMain.handle('toggleMaximizeTextFileEditor', (event) => {
  const editorWindow = BrowserWindow.fromWebContents(event.sender);
  if (!editorWindow || editorWindow.isDestroyed()) {
    return false;
  }
  if (editorWindow.isMaximized()) {
    editorWindow.unmaximize();
    return false;
  }
  editorWindow.maximize();
  return true;
})

ipcMain.handle('isTextFileEditorMaximized', (event) => {
  const editorWindow = BrowserWindow.fromWebContents(event.sender);
  return editorWindow && !editorWindow.isDestroyed() ? editorWindow.isMaximized() : false;
})

ipcMain.handle('notifyTextFileEditorSaved', (_event) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send('ce-manual-confirmation-saved');
  }
})
