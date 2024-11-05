import { ipcMain } from "electron";
import path from "path";
import fs from "fs";
import sqlite3Obj from "sqlite3";
import ResData from "@/server/models/ResData";
import { STATUS_CODE } from "@/server/models/Constant";
import { app } from "electron";
const sqlite3 = sqlite3Obj.verbose();


let DB_PATH = path.join(app.getAppPath(), '.', 'bundled', 'data', 'app.db');





// 判断是否是正式环境
if (app.isPackaged) {
    if(process.platform === 'darwin') {
        // 正式环境
        DB_PATH =  path.join(app.getAppPath(), '..', './data/app.db');
    } else {
        // 正式环境
        // 获取用户本地应用数据目录 (C:\Users\用户名\AppData\Local\软件名)
        const userDataPath = app.getPath('userData');

        // 设置数据库路径为：C:\Users\用户名\AppData\Local\软件名\app.db
        DB_PATH = path.join(userDataPath, 'app.db');

        // 检查数据库文件是否已经存在
        if (!fs.existsSync(DB_PATH)) {
            // 如果不存在，初始化数据库或复制初始数据库文件
            const dbOriginalPath = path.join(process.resourcesPath, 'data', 'app.db');
            fs.copyFileSync(dbOriginalPath, DB_PATH);
        } else {
            setTimeout(() => {
                update();
            })
        }
    }
}


async function update () {
    // 打开数据库
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to the database.');
        }
    });
    // 检查版本更新
    // 有一个新列 `server_map_mission_path`，需要在 `server_config_file` 中存在
    await db.all("PRAGMA table_info(server_config_file)", async (err, columns) => {
        if (err) {
            console.error("Error checking table structure:", err);
            return;
        }
        // 检查列是否已存在
        const columnExists = columns.some((column:any) => column.name === 'server_map_mission_path');
        
        if (!columnExists) {
            // 如果列不存在，添加新列
            await db.run("ALTER TABLE server_config_file ADD COLUMN server_map_mission_path TEXT", (err) => {
                if (err) console.error("Error adding new column:", err);
                else console.log("New column added successfully.");
            });
        }
    });
    db.close();
}


// 打开数据库
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the database.');
    }
});

// 数据库操作
ipcMain.handle('sqlite3Execute', (_event, type, sql, params): Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
    if(type === 'list') {
        return new Promise<string>((resolve, reject) => {
            db.all(sql ,params, (err,rows) => {
                if(err) {
                    resData.statusCode = STATUS_CODE.DATABASE_ERROR;
                    resData.data = err.message;
                    reject(JSON.stringify(resData));
                } else {
                    resData.statusCode = STATUS_CODE.SUCCESS;
                    resData.data = rows;
                    resolve(JSON.stringify(resData));
                }
            })
        })
    }
    else if(type === 'single') {
        return new Promise<string>((resolve, reject) => {
            db.get(sql , params, (err,row) => {
                if(err) {
                    resData.statusCode = STATUS_CODE.DATABASE_ERROR;
                    resData.data = err.message;
                    reject(JSON.stringify(resData));
                } else {
                    resData.statusCode = STATUS_CODE.SUCCESS;
                    resData.data = row;
                    resolve(JSON.stringify(resData));
                }
            })
        })
    }
    else {
        return new Promise<string>((resolve, reject) => {
            db.run(sql, params, (err: Error) => {
                if(err) {
                    resData.statusCode = STATUS_CODE.DATABASE_ERROR;
                    resData.data = err.message;
                    reject(JSON.stringify(resData));
                } else {
                    resData.statusCode = STATUS_CODE.SUCCESS;
                    resData.data = 'success';
                    resolve(JSON.stringify(resData));
                }
            })
        })
    }
})

export default {
    DB_PATH
}
