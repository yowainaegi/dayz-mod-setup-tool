import {app, BrowserWindow, ipcMain, nativeImage} from "electron";
import path from "path";
const isDevelopment = !app.isPackaged;

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

// nodejs服务端API
import "@/server/service/index";
// db操作API
import "@/server/sqlite/index";

let win: BrowserWindow;
let winDefaultPosition: number[];
const dialogOptionsByWebContentsId = new Map<number, Required<AppDialogOptions>>();

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1024,
    height: 670,
    resizable: true,
    show: false,
    frame: false,
    hasShadow: true,
    thickFrame: true,
    minWidth: 1024,
    minHeight: 670,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    },
  });

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
  win.setSize(1024, 670);
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
    const dialogWidth = 388;
    const dialogHeight = 192;
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
      x: dialogPosition?.x,
      y: dialogPosition?.y,
      parent: parentWindow,
      modal: true,
      show: false,
      frame: false,
      hasShadow: true,
      thickFrame: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      backgroundColor: '#3d3d3d',
      title: dialogOptions.title,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload/preload.js")
      },
    });

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

ipcMain.handle('getNativeDialogOptions', (event) => {
  return dialogOptionsByWebContentsId.get(event.sender.id);
})

ipcMain.handle('closeNativeDialog', (event, response: number) => {
  ipcMain.emit(`app-dialog-response-${event.sender.id}`, event, response);
})

/* ipcMain处理事件 结束 */
