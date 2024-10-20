const { defineConfig } = require("@vue/cli-service");
const path = require('path');
module.exports = defineConfig({
  publicPath: './',
  transpileDependencies: true, // 保持转换依赖
  lintOnSave: false,
  // exports对象中加入配置
  pluginOptions:{
    electronBuilder:{
      nodeIntegration: true,
      preload: 'src/server/electron/preload.ts',
      builderOptions: {
        extraResources: [
          {
            from: "./public/data/app.db",
            to: "./data/app.db"
          },
          {
            from: "./public/resource",
            to: "./"
          }
        ],
        "productName": "DayZModSetupTool",
        "appId": "dayz-mod-setup-tool",

        "mac": {
          "icon": "./public/app-icons/icons/512x512.png"
        },
        "win": {
          "icon": "./public/app-icons/icons/512x512.png",
          "target": {
            "target": "portable",
            "arch": ["x64", "ia32"]
          }
        },
        "linux": {
          "icon": "./public/app-icons/icons/512x512.png"
        },
        // "nsis": {
        //   "oneClick": false,
        //   "guid": "dayz-mod-setup-tool",
        //   "perMachine": true,
        //   "allowElevation": true,
        //   "allowToChangeInstallationDirectory": true,
        //   "installerIcon": "./public/app-icons/icons/icon.ico",
        //   "uninstallerIcon": "./public/app-icons/icons/icon.ico",
        //   "installerHeaderIcon": "./public/app-icons/icons/icon.ico",
        //   "createDesktopShortcut": true,
        //   "createStartMenuShortcut": true,
        //   "shortcutName": "DayZ Mod Setup Tool"
        // }
        "portable": {
          "artifactName": "${productName}-${version}.exe",  // 自定义便携文件名
          "requestExecutionLevel": "user",  // 无需管理员权限
        }
      }
    }
  },

  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), //把 src 的别名设置为 @
      }
    }
  },

  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    },
  },

  devServer: {
    client: {
        overlay: false
    }
  }
});
