# DayZ Mod Setup Tool 当前流程分析

本文档基于当前代码实现梳理项目实际流程。README 可作为使用说明参考，但其中部分依赖版本和中文内容已过时或编码异常，因此以下内容以 `src` 目录中的实现为准。

## 1. 项目定位

当前项目是一个 Electron + Vue 3 桌面工具，目标是把 DayZ Server 挂载 Mod 的常见步骤图形化：

- 从 DayZ Launcher 本地数据读取已订阅 Mod 和预设文件。
- 复制纯净 DayZ Server 到目标目录。
- 复制 Mod 文件夹和 Key 文件。
- 生成或修改 `startup.bat`。
- 修改 `serverDZ.cfg` 中的服务器名称和地图 mission 模板。
- 为每个 Mod 创建固定结构的配置占位目录。
- 将用户放入占位目录的 XML 配置复制到 mission 目录，并写入 `cfgeconomycore.xml`。

目前它并不是完整的 Mod 配置合并器。`types.xml`、`events.xml` 等内容不会从 Mod 作者任意目录自动发现、解析、合并到官方文件中，而是依赖用户把配置文件放入工具创建的固定占位目录。

## 2. 技术结构

### 2.1 入口与运行时

- 主进程入口：`src/background.ts`
- 渲染进程入口：`src/main.ts`
- 路由定义：`src/router/index.ts`
- 全局状态：`src/store/index.ts`
- SQLite 初始化和 IPC：`src/server/sqlite/index.ts`
- 文件系统 IPC：`src/server/service/index.ts`、`src/server/service/OsService.ts`

Electron 主进程启动后会：

1. 创建无边框窗口。
2. 注册 `serverAPI` IPC，用于调用文件系统相关方法。
3. 注册 `sqlite3Execute` IPC，用于执行 SQLite 查询和写入。
4. 注册窗口控制 IPC，例如最小化、最大化、关闭。

### 2.2 数据库

开发环境数据库位于：

```text
public/data/app.db
```

打包后的 Windows 环境会复制到 Electron `userData` 目录。主要使用两类数据：

- `server_config_file`：保存服务端配置档。
- `app_config`：保存应用设置，例如语言。
- `app_log`：保存错误日志。

`server_config_file` 当前字段模型见 `src/server/models/ServerConfigFile.ts`：

```text
id
server_id
server_name
config_file_name
pure_server_folder_path
server_folder_path
deploy_server_folder_path
preset_file_name
server_profile_folder
server_map_mission_path
```

其中 `server_map_mission_path` 是后续新增字段，用于记录地图 Mod 的 mission 占位目录。

## 3. 页面与业务流程总览

路由顺序大致如下：

```text
/Initialization
  -> /Index
  -> /SelectType
  -> /ConfigFileList
  -> /ConfigFileEdit
  -> /ModChoose
  -> /EditServer
  -> /ModMountConfig
```

辅助页面：

- `/Settings`：语言设置和 DayZ Launcher 路径检查。
- `/LogList`：查看应用日志。

## 4. 初始化流程

页面：`src/views/InitializationView.vue`

启动检查逻辑：

1. 调用 `getOsUserName` 获取 Windows 用户名。
2. 拼接 DayZ Launcher 数据目录：

```text
C:\Users\<用户名>\AppData\Local\DayZ Launcher
```

3. 如果目录存在，跳转 `/Index`。
4. 如果目录不存在，弹窗提示后跳转 `/Settings`。

该流程默认用户使用 Windows，且 DayZ Launcher 数据位于默认路径。

## 5. 服务端配置档流程

### 5.1 选择创建或更新

页面：`src/views/SelectTypeView.vue`

用户选择：

- Create：创建新服务端。
- Update：给已有服务端追加 Mod。

选择结果写入 Vuex：

```text
operationMode = create | update
```

然后进入 `/ConfigFileList`。

### 5.2 配置档列表

页面：`src/views/ConfigFileListView.vue`

该页面从 SQLite 读取 `server_config_file` 列表。用户可以：

- 搜索配置档。
- 创建配置档。
- 编辑配置档。
- 删除配置档。
- 选择一个配置档进入 Mod 选择页。

在 `create` 模式下，右键菜单允许编辑和删除配置档。选择配置档后会写入 Vuex：

```text
selectedConfigFile
```

### 5.3 创建或编辑配置档

页面：`src/views/ConfigFileEditView.vue`

表单字段：

- `server_name`：服务器名称，会写入 `serverDZ.cfg` 的 `hostname`。
- `config_file_name`：工具内备注名。
- `pure_server_folder_path`：纯净 DayZ Server 目录。
- `server_folder_path`：创建后的服务端目录，要求为空目录。
- `deploy_server_folder_path`：部署目录，目前通常与 `server_folder_path` 一致。
- `preset_file_name`：DayZ Launcher 的预设 XML 文件路径。
- `server_profile_folder`：服务端 profile 目录名。

预设文件目录按固定路径读取：

```text
C:\Users\<用户名>\AppData\Local\DayZ Launcher\Presets
```

校验规则：

- `pure_server_folder_path` 必须存在。
- `server_folder_path` 必须存在且为空。
- `server_name` 和 `server_profile_folder` 不能包含部分特殊字符。

保存时写入或更新 SQLite 的 `server_config_file`。

## 6. Mod 选择流程

页面：`src/views/ModChooseView.vue`

### 6.1 读取已订阅 Mod

工具读取 DayZ Launcher 的：

```text
C:\Users\<用户名>\AppData\Local\DayZ Launcher\Steam.json
```

从其中的 `Extensions` 读取 Mod 信息，主要使用：

- `Id`
- `DisplayName`
- `Author`
- `ExtensionPath`
- `StorageInfo.CachedPreviewImage`

工具会为每个 Mod 生成目标文件夹名：

```text
<WorkshopId>-@<DisplayName>
```

其中 WorkshopId 来自 `Id` 中 `steam:` 后面的部分。

### 6.2 读取 DayZ Launcher 预设

如果配置档选择了 `preset_file_name`，工具读取该 XML 预设文件，解析：

```text
addons-presets/published-ids/id
```

这些 Id 会被标记为已加入列表。

在更新模式下，预设中已有的 Mod 会被标记为不可由本工具移除，实际更新任务只处理新增 Mod。

### 6.3 手动选择地图 Mod

右侧已加入列表中可以标记一个 Mod 为地图 Mod：

```text
isMapMod = true
```

当前实现只允许一个地图 Mod。该状态会影响后续是否创建 `map_missions` 占位目录。

## 7. 创建或更新服务端流程

页面：`src/views/EditServerView.vue`

核心任务函数是 `task(totalTasks, progressManager, mode)`。

### 7.1 创建模式

Create 模式执行：

1. 复制纯净 DayZ Server 目录到 `server_folder_path`。
2. 收集所有 Mod 的 Key 目录并复制到服务端 `Keys`。
3. 复制所有 Mod 文件夹到服务端根目录，并重命名为 `<WorkshopId>-@<DisplayName>`。
4. 在每个已复制的 Mod 目录下创建 `DAYZ_MOD_SETUP_TOOL_CREATED` 占位目录。
5. 创建服务端 profile 目录。
6. 生成 `startup.bat`。
7. 修改 `serverDZ.cfg` 的 `hostname`。

### 7.2 更新模式

Update 模式只处理新加入的 Mod：

1. 过滤掉 `CanBeRemovedDZMSUTool === false` 的既有 Mod。
2. 复制新增 Mod 的 Key 到服务端 `Keys`。
3. 复制新增 Mod 文件夹到服务端根目录。
4. 在新增 Mod 目录下创建 `DAYZ_MOD_SETUP_TOOL_CREATED` 占位目录。
5. 修改已有 `startup.bat`，追加 Mod 启动参数。
6. 修改 `serverDZ.cfg` 的 `hostname`。

更新模式不会复制纯净服务端目录。

### 7.3 Key 复制规则

每个 Mod 优先查找：

```text
<Mod.ExtensionPath>\Keys
```

如果不存在，则尝试：

```text
<Mod.ExtensionPath>\Key
```

找到的目录会复制到：

```text
<server_folder_path>\Keys
```

注意：如果 `Keys` 不存在，代码会直接把 `Key` 加入复制列表，没有再次显式校验 `Key` 是否存在。

### 7.4 Mod 文件夹复制规则

每个 Mod 的 `ExtensionPath` 会完整复制到：

```text
<server_folder_path>\<WorkshopId>-@<DisplayName>
```

复制后工具在该目录下创建：

```text
DAYZ_MOD_SETUP_TOOL_CREATED
```

并在其中创建固定子目录：

```text
types
spawnabletypes
globals
economy
events
messages
map_missions
```

其中 `map_missions` 只在该 Mod 被用户标记为地图 Mod 时创建。

### 7.5 启动脚本生成规则

模板文件：

```text
public/resource/startup.bat
```

工具会修改三处：

1. 在 `cd` 后写入服务端目录。
2. 在 `"-mod=` 后写入所有 Mod 文件夹名，使用分号分隔。
3. 在 `-profiles=` 后写入 profile 目录名。

输出到：

```text
<server_folder_path>\startup.bat
```

更新模式下，工具读取已有 `startup.bat` 并在原有 `"-mod=` 位置后插入新增 Mod 名称。

### 7.6 serverDZ.cfg 修改规则

创建/更新服务端阶段会读取：

```text
<server_folder_path>\serverDZ.cfg
```

并用正则替换：

```text
hostname = "...";
```

替换为配置档中的 `server_name`。

地图 Mod 挂载阶段还会替换：

```text
template="...";
```

为当前 mission 文件夹名。

## 8. Mod 配置挂载流程

页面：`src/views/ModMountConfigView.vue`

这是当前项目处理 `types`、`events` 等配置的关键流程。

### 8.1 用户手动准备配置文件

`EditServerView` 完成后，工具会进入 `ModMountConfigView`。页面文案提示用户：

1. 打开每个 Mod 目录下的 `DAYZ_MOD_SETUP_TOOL_CREATED`。
2. 把 Mod 作者提供的配置 XML 手动放进对应子目录。
3. 点击下一步，让工具复制并注册这些文件。

例如用户需要手动放置：

```text
<server_folder_path>\<modFolder>\DAYZ_MOD_SETUP_TOOL_CREATED\types\xxx.xml
<server_folder_path>\<modFolder>\DAYZ_MOD_SETUP_TOOL_CREATED\events\xxx.xml
<server_folder_path>\<modFolder>\DAYZ_MOD_SETUP_TOOL_CREATED\spawnabletypes\xxx.xml
```

### 8.2 地图 mission 处理

工具统计所有 `DAYZ_MOD_SETUP_TOOL_CREATED\map_missions`：

- 如果超过 1 个，直接报错。
- 如果等于 1 个，认为本次有地图 Mod。
- 如果等于 0 个，则使用默认 mission：

```text
dayzOffline.chernarusplus
```

如果配置档中已保存 `server_map_mission_path`，则会校验该路径并使用其中的 mission 名称。

地图 mission 校验规则：

1. `map_missions` 目录下必须刚好有一个子目录。
2. 子目录名必须包含 `.`。
3. 子目录内必须包含：

```text
init.c
db
```

如果是地图 Mod，工具会复制：

```text
<map_missions>\<missionFolderName>
```

到：

```text
<server_folder_path>\mpmissions\<missionFolderName>
```

然后修改 `serverDZ.cfg` 的 `template`。

### 8.3 普通 Mod 配置复制

工具遍历每个 `DAYZ_MOD_SETUP_TOOL_CREATED` 的子目录。除了 `map_missions` 外，如果子目录非空，就复制到当前 mission 下：

```text
<server_folder_path>\mpmissions\<missionFolderName>\<modFolder>\<configFolderName>
```

示例：

```text
<server_folder_path>\mpmissions\dayzOffline.chernarusplus\123456789-@ExampleMod\types
<server_folder_path>\mpmissions\dayzOffline.chernarusplus\123456789-@ExampleMod\events
```

如果某个子目录为空，则跳过复制，但仍会把该任务进度置为完成。

### 8.4 写入 cfgeconomycore.xml

工具读取当前 mission 的：

```text
cfgeconomycore.xml
```

如果 `economycore.ce` 不存在，则创建空数组。

然后对每个非空配置目录追加一段 `ce`：

```xml
<ce folder="<modFolder>/<configFolderName>">
  <file name="<fileName>" type="<configFolderName>" />
</ce>
```

例如：

```xml
<ce folder="123456789-@ExampleMod/types">
  <file name="types.xml" type="types" />
</ce>
```

最终把修改后的对象重新序列化写回 `cfgeconomycore.xml`。

## 9. 当前对 types.xml、events.xml 等文件的真实处理方式

当前项目不会主动做以下事情：

- 不会递归扫描 Mod 作者原始目录来寻找 `types.xml`、`events.xml`、`cfgspawnabletypes.xml` 等文件。
- 不会识别作者自定义目录名。
- 不会解析并合并 XML 节点到 DayZ 原始 `db\types.xml`、`db\events.xml` 等文件。
- 不会去重或检测冲突，例如重复 `type name`、重复 event、重复 spawnable 配置。
- 不会判断某个 XML 文件应该放入哪个 CE 类型目录，除非用户已经手动放入固定占位目录。

当前实现采用的是 DayZ `cfgeconomycore.xml` 的扩展挂载方式：

1. 用户把 Mod 配置 XML 手动分类到工具创建的目录。
2. 工具把这些目录复制到 mission 下。
3. 工具在 `cfgeconomycore.xml` 中追加 `<ce>` 引用。

因此，项目目前解决的是“把已经分类好的配置文件注册到 CE”，而不是“从作者任意目录自动发现并合并配置”。

## 10. 当前流程的主要限制

### 10.1 依赖固定本地路径

DayZ Launcher 路径固定为：

```text
C:\Users\<用户名>\AppData\Local\DayZ Launcher
```

目前设置页只显示和检查路径，没有实现自定义 DayZ Launcher 路径。

### 10.2 配置文件需要用户手动分类

`DAYZ_MOD_SETUP_TOOL_CREATED` 的目录结构是固定的，但 Mod 作者提供文件的位置、名称和结构不固定。当前项目没有自动归类能力，所以用户仍需手动查找和复制。

### 10.3 没有 XML 语义合并

工具只把文件复制到 mission 子目录，并向 `cfgeconomycore.xml` 添加引用。它不会把内容合并到官方 XML，也不会做冲突检测。

### 10.4 Update 模式对 startup.bat 的处理较脆弱

更新模式通过字符串位置查找 `"-mod=` 并插入内容，依赖现有 `startup.bat` 格式与工具预期一致。如果用户手动改过脚本，可能产生错误结果。

### 10.5 Map Mod 只能标记一个

当前 UI 和流程只支持一个地图 Mod。如果 `map_missions` 超过一个会报错。

### 10.6 server_config_file 新字段未完整写入

`server_map_mission_path` 在查询和模型中存在，也有 `modifyMapMissionPathByServerId` 更新逻辑，但创建/编辑配置档时的 insert/update SQL 没有包含该字段。它主要由地图 Mod 流程后续写入。

## 11. 当前流程图

```text
启动应用
  |
  v
检查 DayZ Launcher 默认目录
  |
  +--失败--> Settings
  |
  v
Index
  |
  v
SelectType: Create / Update
  |
  v
ConfigFileList
  |
  +--创建/编辑配置档--> ConfigFileEdit --> 保存到 SQLite
  |
  v
选择配置档
  |
  v
ModChoose
  |
  +--读取 Steam.json
  +--读取预设 XML
  +--用户选择新增 Mod
  +--用户可标记一个地图 Mod
  |
  v
EditServer
  |
  +--Create: 复制纯净服务端
  +--复制 Keys
  +--复制 Mod 文件夹
  +--创建 DAYZ_MOD_SETUP_TOOL_CREATED 占位目录
  +--创建 profile
  +--生成/修改 startup.bat
  +--修改 serverDZ.cfg hostname
  |
  v
ModMountConfig
  |
  +--用户手动放入 types/events 等 XML
  +--复制 map mission, 如存在
  +--复制各 Mod 配置目录到 mpmissions
  +--写入 cfgeconomycore.xml
  |
  v
完成
```

## 12. 面向后续自动化的结论

如果目标是让 `types.xml`、`events.xml` 等也实现真正自动化，需要新增一层“Mod 配置发现与归类/合并”能力。当前架构中比较自然的接入点有两个：

1. 在 `EditServerView` 复制完 Mod 后，扫描每个 `<server_folder_path>\<modFolder>`。
2. 在 `ModMountConfigView` 执行前，自动填充 `DAYZ_MOD_SETUP_TOOL_CREATED` 下的分类目录，或直接生成 mission 下的配置目录和 `cfgeconomycore.xml` 引用。

推荐优先做“发现并归类到 CE 扩展目录”，而不是直接合并进原始 `db` XML。原因是当前项目已经使用 `cfgeconomycore.xml` 挂载扩展文件，这条路线与现有实现兼容，风险比直接改官方 `types.xml`、`events.xml` 更低。
