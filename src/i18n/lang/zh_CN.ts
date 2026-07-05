export default {
    common: {
        modal: {
            confirm: {
                title: '确认',
                yes: '确定',
                cancel: '取消'
            },
            warning: {
                title: '提示'
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
        configStatus: {
            draft: '草稿',
            workspace_ready: '工作区已准备',
            server_created: '服务器已创建',
            ce_mounted: 'CE 已挂载',
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
        chooseConfigFileCheck: '请选择配置文件',
        workflowDialogs: {
            enterUpdateTitle: '进入更新流程？',
            enterUpdateMessage: '这个配置文件已经完成服务器创建。再次执行创建可能会覆盖现有服务器文件。是否切换到更新流程并编辑现有服务器？',
            enterUpdateConfirm: '进入更新',
            enterCreateTitle: '进入创建流程？',
            enterCreateMessage: '这个配置文件还没有完成服务器创建。更新流程会跳过初始纯净服务器复制。是否切换到创建流程并先完成初始设置？',
            enterCreateConfirm: '进入创建',
            missingWorkspaceMessage: '服务器文件夹路径或预设为空。',
            replacePresetTitle: '替换工作预设？',
            replacePresetCompletedMessage: '服务器创建后更换预设可能导致已部署 MOD 不一致。是否继续并将此配置重置为工作区已准备？',
            replacePresetMessage: '更换预设会替换当前工作预设，并丢弃此工具中已完成的 MOD 修改。',
            replacePresetConfirm: '替换',
        }
    },
    ConfigFileEditView: {
        pageTitle: '设置配置文件',
        save: '保存',
        back: '返回',
        status: '状态',
        resetStatus: '重置状态',
        statusResetSuccess: '状态已重置',
        modMountMode: 'MOD 挂载模式',
        modMountModeOptions: {
            copy: '复制 MOD 文件',
            junction: '使用目录链接',
        },
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
        mount: '挂载',
        done: '完成',
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
        },
        summary: {
            total: '总数',
            enabled: '已启用',
            needReview: '需检查',
            mission: 'Mission',
            selectMission: '选择 mission',
        },
        mission: {
            title: 'Mission / 地形',
            conflictWarning: '检测到多个地形 MOD。请选择一个 mission，或处理其他项。',
            configured: '已配置',
            imported: '已导入',
            serverDefault: '服务器默认',
            notFound: '未找到',
            selectTemplateFolder: '选择 DayZ mission 模板文件夹',
        },
        table: {
            mod: 'MOD',
            terrainResource: '匹配度',
            mission: 'Mission',
            status: '状态',
            reason: '原因',
            action: '操作',
            mods: 'Mods',
            candidateXmlFiles: '候选 XML 文件',
            selected: '已选',
            select: '选择',
            file: '文件',
            ceType: 'CE 类型',
            confidence: '匹配度',
            empty: '没有 CE 配置候选文件。',
        },
        actions: {
            useThisMission: '使用此 Mission',
            import: '导入',
            ignore: '忽略',
            unignore: '取消忽略',
            process: '标记已处理',
            unprocess: '取消已处理',
            reselect: '重新选择',
            selectVisible: '选择可见项',
            clear: '清空',
            preview: '预览',
            edit: '编辑',
            continue: '继续',
        },
        status: {
            selected: '已选择',
            ready: 'mission 已就绪',
            conflict: '冲突',
            missing: 'mission 缺失',
            ignored: '已忽略',
            processed: '已处理',
            unprocessed: '未处理',
            waiting_to_mount: '等待挂载',
        },
        confidence: {
            high: '高',
            medium: '中',
            low: '低',
            ignored: '已忽略',
        },
        reasons: {
            ignoredByUser: '用户已忽略',
            processedByUser: '用户已处理',
            selectedMission: '已选择为服务器 mission',
            missionMissing: '未找到 mission 模板',
            missionConflict: '存在多个地形 mission，请选择一个或处理其他项',
            missionReady: '已找到 mission 模板',
        },
        xmlReasons: {
            noCeRootTagFound: '未找到 CE 根标签',
            unofficialCeFileName: 'XML 文件名不是官方 CE 文件名',
            cfgeconomycoreIndexFile: 'cfgeconomycore.xml 是 CE 索引文件，不是挂载目标',
            needsUserReview: '需要用户检查',
            manualCopyOrMergeRequired: '需要手动复制或合并',
            ignoredByUser: '用户已忽略',
            processedByUser: '用户已处理',
        },
        errors: {
            serverFolderEmpty: 'server_folder_path 为空',
            unprocessedFiles: '仍有未处理文件。请先处理或忽略后再完成。',
            unprocessedMission: '仍有未处理的 mission/地形项。请选择一个 mission、导入缺失模板、处理或忽略后再挂载。',
        },
        dialogs: {
            mountHighConfidenceTitle: '挂载高可信度文件',
            mountHighConfidenceMessage: '将挂载 {mountCount} 个高可信度文件，跳过 {skippedCount} 个中/低可信度或已忽略文件。',
        }
    },
    TextFilePreviewView: {
        source: '源文件',
        savedCopy: '已保存副本',
        openContainingFolder: '打开所在文件夹',
        editToolCopy: '编辑工具副本',
        truncatedWarning: '文件大于 2MB，仅显示前 2MB 内容。',
    },
    TextFileEditorView: {
        source: '源文件',
        savedCopy: '已保存副本',
        editingSavedCopy: '正在编辑已保存副本',
        formatXml: '格式化 XML',
        revert: '还原',
        save: '保存',
        xmlFormatFailed: 'XML 格式化失败',
        saveSuccess: '已保存到 {path}',
        saveFailed: '保存失败',
        revertConfirmTitle: '还原到源文件？',
        revertConfirmMessage: '这会删除 DAYZ_MOD_SETUP_TOOL_CREATED 中的已保存副本，并将此文件还原为原始源文件内容。',
        revertSuccess: '已还原到源文件',
        revertFailed: '还原失败',
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
