"use strict";

import {app, protocol, BrowserWindow, ipcMain, nativeImage} from "electron";
import path from "path";
const isDevelopment = process.env.NODE_ENV !== "production";
import electronDevToolsInstaller from "electron-devtools-installer";
import { VUEJS_DEVTOOLS } from "electron-devtools-installer";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

// nodejs服务端API
import "@/server/service/index";
// db操作API
import "@/server/sqlite/index";
import {createProtocol} from "vue-cli-plugin-electron-builder/lib";

let win: BrowserWindow;
let winDefaultPosition: number[];

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1024,
    height: 670,
    resizable: true,
    show: false,
    frame: false,
    minWidth: 1024,
    minHeight: 670,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION as unknown as boolean,
      preload: path.join(__dirname, "preload.js")
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  if(isDevelopment) {
    const appIcon = nativeImage.createFromPath(path.join(__dirname, '/bundled/app-icons/icons/512x512.png'))
    win.setIcon(appIcon)
    if(process.platform === 'darwin') {
      app.dock.setIcon(appIcon)
    } else {

    }
  }

  // 避免白屏
  win.once('ready-to-show', () => {
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

/* ipcMain处理事件 结束 */