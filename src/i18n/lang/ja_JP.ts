export default {
    common: {
        modal: {
            confirm: {
                title: '確認',
                yes: 'はい',
                cancel: 'キャンセル'
            },
            warning: {
                title: '通知'
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
        configStatus: {
            draft: '下書き',
            workspace_ready: 'ワークスペース準備済み',
            server_created: 'サーバー作成済み',
            ce_mounted: 'CE マウント済み',
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
        chooseConfigFileCheck: '設定ファイルを選択してください',
        workflowDialogs: {
            enterUpdateTitle: '更新フローに入りますか？',
            enterUpdateMessage: 'この設定はすでにサーバー作成が完了しています。作成を再実行すると既存のサーバーファイルを上書きする可能性があります。更新フローに切り替えて既存サーバーを編集しますか？',
            enterUpdateConfirm: '更新へ',
            enterCreateTitle: '作成フローに入りますか？',
            enterCreateMessage: 'この設定はまだサーバー作成が完了していません。更新フローでは初期のクリーンサーバーコピーをスキップします。作成フローに切り替えて初期設定を完了しますか？',
            enterCreateConfirm: '作成へ',
            missingWorkspaceMessage: 'サーバーフォルダーのパスが空です。',
            replacePresetTitle: '新しいプリセットの差分を取り込みますか？',
            replacePresetCompletedMessage: '新しいプリセットを読み込み、追加/削除される MOD を MOD 選択画面に表示します。削除された MOD のツール管理のマウントは清理しますが、手動設定は確認して修正する必要があります。続行しますか？',
            replacePresetMessage: '新しいプリセットを読み込み、追加/削除される MOD として表示します。現在の作業プリセットは直接上書きしません。',
            replacePresetConfirm: '差分を取り込む',
        }
    },
    ConfigFileEditView: {
        pageTitle: '設定ファイル編集',
        save: '保存',
        back: '戻る',
        status: '状態',
        resetStatus: '状態をリセット',
        statusResetSuccess: '状態をリセットしました',
        modMountMode: 'MOD マウント方式',
        modMountModeOptions: {
            copy: 'MOD ファイルをコピー',
            junction: 'ディレクトリリンクを使用',
        },
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
        updateWarning: '既存サーバーにMODを追加してください',
        dependencyConfirmTitle: '依存 MOD が必要です',
        dependencyConfirmMessage: '{modName} は以下の MOD に依存しています。一緒に追加しますか？\n{dependencies}',
        dependencySelectionConfirmMessage: '現在追加済みの MOD に以下の依存関係が不足しています。一緒に追加しますか？\n{dependencies}',
        dependencySelectionInvalid: '現在追加済みの MOD に以下の依存関係が不足していますが、現在の購読リストにありません:\n{dependencies}',
        dependencyMissingUnavailable: '{modName} には以下の依存 MOD が必要ですが、現在の購読リストにありません:\n{dependencies}',
        dependencyRemoveBlocked: '{modName} は削除できません。以下の追加済み MOD が依存しています:\n{dependents}',
        removeExistingModConfirmTitle: 'デプロイ済み MOD を削除しますか？',
        removeExistingModConfirmMessage: '更新時に {modName} を削除すると、サーバー内の MOD フォルダーを削除し、ツール管理の CE/mission 参照を清理します。関連する手動設定は確認して削除する必要があります。続行しますか？'
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
        mount: 'マウント',
        done: '完了',
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
        },
        summary: {
            total: '合計',
            enabled: '有効',
            needReview: '確認必要',
            mission: 'Mission',
            selectMission: 'mission を選択',
        },
        mission: {
            title: 'Mission / Terrain',
            conflictWarning: '複数の地形 MOD が検出されました。1 つの mission を選択するか、他の項目を処理してください。',
            configured: '設定済み',
            imported: 'インポート済み',
            serverDefault: 'サーバー既定',
            notFound: '未検出',
            selectTemplateFolder: 'DayZ mission テンプレートフォルダーを選択',
        },
        table: {
            mod: 'MOD',
            terrainResource: '一致度',
            mission: 'Mission',
            status: '状態',
            reason: '理由',
            action: '操作',
            mods: 'Mods',
            candidateXmlFiles: '候補 XML ファイル',
            selected: '選択済み',
            select: '選択',
            file: 'ファイル',
            ceType: 'CE タイプ',
            confidence: '一致度',
            empty: 'CE 設定候補ファイルはありません。',
        },
        actions: {
            useThisMission: 'この Mission を使用',
            import: 'インポート',
            ignore: '無視',
            unignore: '無視を解除',
            process: '処理済みにする',
            unprocess: '処理済みを解除',
            reselect: '再選択',
            selectVisible: '表示項目を選択',
            clear: 'クリア',
            preview: 'プレビュー',
            edit: '編集',
            continue: '続行',
        },
        status: {
            selected: '選択済み',
            ready: 'mission 準備済み',
            conflict: '競合',
            missing: 'mission なし',
            ignored: '無視済み',
            processed: '処理済み',
            unprocessed: '未処理',
            waiting_to_mount: 'マウント待ち',
        },
        confidence: {
            high: '高',
            medium: '中',
            low: '低',
            ignored: '無視済み',
        },
        reasons: {
            ignoredByUser: 'ユーザーが無視しました',
            processedByUser: 'ユーザーが処理しました',
            selectedMission: 'サーバー mission として選択済み',
            missionMissing: 'mission テンプレートが見つかりません',
            missionConflict: '複数の地形 mission があります。1 つを選択するか、他の項目を処理してください',
            missionReady: 'mission テンプレートが見つかりました',
        },
        xmlReasons: {
            noCeRootTagFound: 'CE ルートタグが見つかりません',
            unofficialCeFileName: 'XML ファイル名が公式 CE ファイル名ではありません',
            cfgeconomycoreIndexFile: 'cfgeconomycore.xml は CE インデックスファイルで、マウント対象ではありません',
            needsUserReview: 'ユーザー確認が必要です',
            manualCopyOrMergeRequired: '手動コピーまたはマージが必要です',
            ignoredByUser: 'ユーザーが無視しました',
            processedByUser: 'ユーザーが処理しました',
        },
        errors: {
            serverFolderEmpty: 'server_folder_path が空です',
            unprocessedFiles: '未処理のファイルがあります。完了する前に処理または無視してください。',
            unprocessedMission: '未処理の mission/terrain 項目があります。マウント前に mission を選択、テンプレートをインポート、処理または無視してください。',
        },
        dialogs: {
            mountHighConfidenceTitle: '高信頼度ファイルをマウント',
            mountHighConfidenceMessage: '{mountCount} 個の高信頼度ファイルをマウントし、{skippedCount} 個の中/低信頼度または無視済みファイルをスキップします。',
        }
    },
    TextFilePreviewView: {
        source: 'ソース',
        savedCopy: '保存済みコピー',
        openContainingFolder: '保存先フォルダーを開く',
        editToolCopy: 'ツールコピーを編集',
        truncatedWarning: 'ファイルが 2MB を超えています。先頭 2MB のみ表示しています。',
    },
    TextFileEditorView: {
        source: 'ソース',
        savedCopy: '保存済みコピー',
        editingSavedCopy: '保存済みコピーを編集中',
        formatXml: 'XML を整形',
        revert: '元に戻す',
        save: '保存',
        xmlFormatFailed: 'XML の整形に失敗しました',
        saveSuccess: '{path} に保存しました',
        saveFailed: '保存に失敗しました',
        revertConfirmTitle: 'ソースに戻しますか？',
        revertConfirmMessage: 'DAYZ_MOD_SETUP_TOOL_CREATED 内の保存済みコピーを削除し、このファイルを元のソース内容に戻します。',
        revertSuccess: 'ソースファイルに戻しました',
        revertFailed: '元に戻せませんでした',
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
