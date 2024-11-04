export default {
    common: {
        modal: {
            confirm: {
                yes: '确定',
                cancel: '取消'
            },
            error: {
                title: {
                    DataBaseError: '数据库错误',
                    ApiError: 'API函数错误',
                    UnknownError: '未知错误',
                },
                ok: '知道了'
            }
        },
        message: {
            success: {
                save: '保存成功',
                delete: '删除成功',
            },
            failed: {
                save: '保存失败',
                delete: '删除失败'
            }
        },
        appLogType: {
            Error: {
                DataBaseError: '数据库错误',
                ApiError: 'API函数错误',
                UnknownError: '未知错误',
            }
        },
        selection: {
            default: '未选择',
        },
        validates: {
            containsSpecialCharacters: '不能包含特殊字符'
        }
    },
    components: {
        TopNavBar: {
            title: 'DayZ 服务器模组挂载工具',
            quitConfirm: '确定要退出么？'
        }
    },
    IndexView: {
        title: '欢迎使用DayZ模组挂载工具',
        pageTitle: '',
    },
    SelectTypeView: {
        pageTitle: '',
        title: '接下来你想要做什么？',
        update: '更新',
        create: '创建',
    },
    ConfigFileListView: {
        pageTitle: '选择配置文件',
        searchKey: '配置文件名',
        next: '下一步',
        back: '返回',
        dropDown: {
            edit: '编辑',
            delete: '删除'
        },
        deleteConfirm: '确定要删除此配置文件么？',
        chooseConfigFileCheck: '请选择配置文件'
    },
    ConfigFileEditView: {
        pageTitle: '设置配置文件',
        save: '保存',
        back: '返回',
        form: {
            fields: {
                serverName: '服务器名称',
                configFileName: '配置文件名称（备注）',
                pureServerFolderPath: '纯净服务器文件夹路径',
                serverFolderPath: '创建服务器文件夹路径',
                deployServerFolderPath: '部署服务器文件夹路径',
                presetFileName: '预设文件',
                serverProfileFolder: '服务器配置文件夹',
                serverId: '服务器ID'
            },
            validates: {
                required: {
                    serverName: '请输入服务器名称',
                    configFileName: '请输入配置文件名称（备注）',
                    pureServerFolderPath: '请输入纯净服务器文件夹路径',
                    serverFolderPath: '请输入创建服务器文件夹路径',
                    deployServerFolderPath: '请输入部署服务器文件夹路径',
                    presetFileName: '请选择预设文件',
                    serverProfileFolder: '请输入服务器配置文件夹名称'
                },
                correctly: {
                    pureServerFolderPath: '请输入正确的纯净服务器文件夹路径',
                    serverFolderPath: '请输入正确的、为空的目录'
                }
            }
        }
    },
    ModChooseView: {
        pageTitle: '选择MOD',
        createNext: '创建',
        updateNext: '更新',
        back: '返回',
        subscriptionTitle: '已订阅的MOD',
        additionalTitle: '已加入的MOD',
        searchInputPlaceHolder: '输入MOD名称',
        tableTitle: {
            id: 'ID',
            name: '名称',
            mapAction: '地图',
            action: '操作',
        },
        emptyText: '暂无MOD',
        createConfirm: '确认要开始创建服务器么？',
        updateConfirm: '确认要开始更新服务器么？',
        updateWarning: '请选择需要加入的MOD',
    },
    EditServerView: {
        completedNext: '完成',
        next: '下一步',
        back: '返回',
        pageTitle: {
            create: '创建服务器',
            update: '更新服务器'
        },
        copyingContent: "({percent}%) 正在复制 {src} 到 {dest}",
        fileFound: "计算中...({processFileCount}个文件被发现)",
        stagesTitle: {
            copy_pure_dayz_server_file_to_target_path: '复制纯净服务器文件夹',
            copy_addons_to_target_path: '复制Addons到服务器文件夹中',
            copy_keys_to_target_path: '复制Keys到服务器文件夹中',
            copy_mods_to_target_path: '复制MOD到新建的服务器文件夹中',
            create_server_profile_folder: '创建服务器配置文件夹',
            edit_start_up_file: '编辑启动文件',
            edit_server_dz_cfg_file: '编辑serverDZ.cfg文件',
            completed: '完成'
        }
    },
    ModMountConfigView: {
        next: '执行',
        completedNext: '完成',
        back: '返回',
        pageTitle: '配置MOD',
        copyingContent: "({percent}%) 正在复制 {src} 到 {dest}",
        fileFound: "计算中...({processFileCount}个文件被发现)",
        mainContent: {
            normalText1:'请在下面给出的路径下完成每种配置文件的分类',
            importantText: '你的DayZServer路径\/id-＠mod名称\/DAYZ_MOD_SETUP_TOOL_CREATED\/',
            normalText2:'如果你已经完成配置文件的分类，请点击执行',
            attention: '注：目前版本只支持 types.xml, spawnabletypes.xml, globals.xml, economy.xml, events.xml, messages.xml'
        },
        stagesTitle: {
            copy_missions_file_to_target_path: '正在复制地图missions文件',
            copy_mod_config_xml_to_target_path: '正在复制Mod的XML配置文件',
            completed: '完成'
        }
    },
    LogListView: {
        pageTitle: '日志',
        logListTitle: {
            logType: '类型',
            logContent: '内容',
            logTime: '时间'
        },
        back: '返回',
        noData: '无数据'
    },
    SettingsView: {
        pageTitle: '设置',
        language: {
            title: '语言',
            zh_CN: '简体中文',
            en_US: 'English',
            ja_JP: '日本語',
        },
        RelatedPaths: {
            title: '相关路径',
            osUserName: '系统用户',
            presetFileFolderPath: '预设文件夹路径',
            dayZLauncherFolderPath: 'DayZ启动程序数据文件夹路径',
            pathCheck: '路径检测',
            pathCheckSuccess: '检测成功',
            pathChecking: '检测中',
            recheck: '重新检测',
            pathCheckFailed: '检测失败',
            workShopFolderPath: '!WorkShop文件夹路径'
        },
        apply: '应用',
        back: '返回'
    },
    InitializationView: {
        checking: '初始化中...',
        checkSuccess: '初始化成功',
        checkFailed: '初始化失败',
        messageBoxOkBtn: '好的',
        messageContent: '初始化失败，请输入必要的路径',
    }
}
