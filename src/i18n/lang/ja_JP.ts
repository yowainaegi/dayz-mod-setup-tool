export default {
    common: {
        modal: {
            confirm: {
                yes: 'はい',
                cancel: 'キャンセル'
            },
            error: {
                title: {
                    DataBaseError: 'データベースエラー',
                    ApiError: 'APIエラー',
                    UnknownError: '未知エラー',
                },
                ok: 'OK'
            }
        },
        message: {
          success: {
            save: '保存成功しました',
            delete: '削除成功しました',
          },
          failed: {
            save: '保存失敗しました',
            delete: '削除失敗しました'
          }
        },
        appLogType: {
            Error: {
                DataBaseError: 'データベースエラー',
                ApiError: 'APIエラー',
                UnknownError: '未知エラー',
            }
        },
        selection: {
            default: '未選択',
        },
        validates: {
            containsSpecialCharacters: '特殊な文字が含まれています'
        }
    },
    components: {
        TopNavBar: {
            title: 'DayZサーバーモードセットアップツール',
            quitConfirm: '本当に退出しますか？'
        },
    },
    IndexView: {
        title: 'ご利用頂きありがとうございます',
        pageTitle: '',
    },
    SelectTypeView: {
        title: '次は何をしようとするでしょうか？',
        pageTitle: '',
        update: '更新',
        create: '新規',
    },
    ConfigFileListView: {
        pageTitle: '設定ファイル選択',
        searchKey: '設定ファイル名',
        next: '次へ',
        back: '戻る',
        dropDown: {
            edit: '編集',
            delete: '削除'
        },
        deleteConfirm: '本当にこの設定ファイルを削除しますか？',
        chooseConfigFileCheck: '設定ファイルを選択してください'
    },
    ConfigFileEditView: {
        pageTitle: '設定ファイル編集',
        save: '保存',
        back: '戻る',
        form: {
            fields: {
                serverName: 'サーバー名',
                configFileName: '設定ファイル名',
                pureServerFolderPath: 'クリーンサーバーパス',
                serverFolderPath: '新規サーバーパス',
                deployServerFolderPath: 'デプロイサーバーパス',
                presetFileName: 'プリセットファイル名',
                serverProfileFolder: 'プロファイルパス',
                serverId: 'サーバーID'
            },
            validates: {
                required: {
                    serverName: 'サーバー名を入力してください',
                    configFileName: '設定ファイル名を入力してください',
                    pureServerFolderPath: 'クリーンサーバーパスを入力してください',
                    serverFolderPath: '新規サーバーを入力してください',
                    deployServerFolderPath: 'デプロイサーバーパスを入力してください',
                    presetFileName: 'プリセットファイル名を入力してください',
                    serverProfileFolder: 'サーバープロファイルフォルダーパスを入力してください'
                },
                correctly: {
                    pureServerFolderPath: 'DayZサーバーフォルダーパスを正しく入力してください',
                    serverFolderPath: '空いてる新規サーバーフォルダーパスを正しく入力してください'
                }
            }
        }
    },
    ModChooseView: {
        pageTitle: 'モード選択',
        createNext: '作成',
        updateNext: '更新',
        back: '戻る',
        subscriptionTitle: '購読したモード',
        additionalTitle: '追加したモード',
        searchInputPlaceHolder: 'モード名',
        tableTitle: {
            id: 'ID',
            name: 'モード名',
            mapAction: 'マップ',
            action: 'アクション',
        },
        emptyText: 'モードが見つかりません',
        createConfirm: '今からサーバーを作成しますか?',
        updateConfirm: '今からサーバーを更新しますか？',
        updateWarning: '既存サーバーにMODを追加してください'
    },
    EditServerView: {
        next: '次へ',
        back: '戻る',
        pageTitle: {
            create: 'サーバー作成',
            update: 'サーバー更新'
        },
        copyingContent: "({percent}%) {src} を {dest} にコピーしています",
        fileFound: "計算中...({processFileCount}個のファイルが見つかりました)",
        stagesTitle: {
            copy_pure_dayz_server_file_to_target_path: 'クリーンサーバーをコピーしています',
            copy_addons_to_target_path: 'Addonsをコピーしています',
            copy_keys_to_target_path: 'Keysをコピーしています',
            copy_mods_to_target_path: 'MODをコピーしています',
            create_server_profile_folder: 'サーバープロファイルフォルダーを作成しています',
            edit_start_up_file: '起動ファイルを編集しています',
            edit_server_dz_cfg_file: 'serverDZ.cfgを編集しています',
            completed: '完成しました'
        }
    },
    ModMountConfigView: {
        next: '実行',
        completedNext: '完了',
        back: '戻る',
        pageTitle: 'モードセッティング',
        copyingContent: "({percent}%) {src} を {dest} にコピーしています",
        fileFound: "計算中...({processFileCount}個のファイルが見つかりました)",
        mainContent: {
            normalText1:'下にあるパスに各種類のファイルを整理してください',
            importantText: 'あなたのDayZServerパス\/id-＠modname\/DAYZ_MOD_SETUP_TOOL_CREATED\/',
            normalText2:'既に整理いたしましたら、実行ボタン押してください',
            attention: '注意：本バージョンは types.xml, spawnabletypes.xml, globals.xml, economy.xml, events.xml, messages.xml しか設定できません'
        },
        stagesTitle: {
            copy_missions_file_to_target_path: 'ミッションファイルをコピーしています',
            copy_mod_config_xml_to_target_path: 'モードのXMLファイルをコピーしています',
            completed: '完了'
        }
    },
    LogListView: {
        pageTitle: 'ログ',
        logListTitle: {
            logType: '種類',
            logContent: '内容',
            logTime: 'タイム'
        },
        back: '戻る',
        noData: 'データを見つかりませんでいた'
    },
    SettingsView: {
        pageTitle: '設定',
        language: {
            title: '言語',
            zh_CN: '简体中文',
            en_US: 'English',
            ja_JP: '日本語',
        },
        RelatedPaths: {
            title: '関連パス',
            osUserName: 'システムユーザー',
            presetFileFolderPath: '設定ファイルフォルダーパス',
            dayZLauncherFolderPath: 'DayZランチャーデータパス',
            pathCheck: 'パスチェック',
            pathCheckSuccess: 'パスのチェックが成功しました',
            pathChecking: 'パスをチェックしています',
            recheck: '再度チェックする',
            pathCheckFailed: 'パスのチェックが失敗しました',
            workShopFolderPath: '!WorkShopフォルダーパス',
        },
        apply: '適用',
        back: '戻る'
    },
    InitializationView: {
        checking: '初期化中...',
        checkSuccess: '初期化成功しました',
        checkFailed: '初期化失敗しました',
        messageBoxOkBtn: 'はい',
        messageContent: '初期化失敗しました、必要なパスを入力してください',
    }
}
