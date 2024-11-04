export default {
    common: {
        modal: {
            confirm: {
                yes: 'Yes',
                cancel: 'Cancel'
            },
            error: {
                title: {
                    DataBaseError: 'DataBase Error',
                    ApiError: 'API Function Error',
                    UnknownError: 'Unknown Error',
                },
                ok: 'OK'
            }
        },
        message: {
          success: {
            save: 'Save successfully',
            delete: 'Delete successfully',
          },
          failed: {
            save: 'Save failed',
            delete: 'Delete failed'
          }
        },
        appLogType: {
            Error: {
                DataBaseError: 'DataBase Error',
                ApiError: 'API Function Error',
                UnknownError: 'Unknown Error',
            }
        },
        selection: {
            default: 'nothing selected',
        },
        validates: {
            containsSpecialCharacters: 'can not contains special letters'
        }
    },
    components: {
        TopNavBar: {
            title: 'DayZ Server Mode Setup Tool',
            quitConfirm: 'Are you sure to quit application ?'
        },
    },
    IndexView: {
        title: 'Welcome to use DayZServerModSetupTool',
        pageTitle: '',
    },
    SelectTypeView: {
        title: 'What do you want to do next ?',
        pageTitle: '',
        update: 'Update',
        create: 'Create',
    },
    ConfigFileListView: {
        pageTitle: 'Choose a config file',
        searchKey: 'config file name',
        next: 'Next',
        back: 'Back',
        dropDown: {
            edit: 'Edit',
            delete: 'Delete'
        },
        deleteConfirm: 'Are you sure to delete this config file ?',
        chooseConfigFileCheck: 'Please choose a config file'
    },
    ConfigFileEditView: {
        pageTitle: 'Config file setup',
        save: 'Save',
        back: 'Back',
        form: {
            fields: {
                serverName: 'Server name',
                configFileName: 'Config file name',
                pureServerFolderPath: 'Pure server path',
                serverFolderPath: 'Create server path',
                deployServerFolderPath: 'Deploy server path',
                presetFileName: 'Preset file',
                serverProfileFolder: 'Server profile folder',
                serverId: 'server ID'
            },
            validates: {
                required: {
                    serverName: 'Server name cannot be empty',
                    configFileName: 'Config file name cannot be empty',
                    pureServerFolderPath: 'Pure server path cannot be empty',
                    serverFolderPath: 'Create server path cannot be empty',
                    deployServerFolderPath: 'deploy server path cannot be empty',
                    presetFileName: 'Preset file cannot be empty',
                    serverProfileFolder: 'Server profile folder cannot be empty'
                },
                correctly: {
                    pureServerFolderPath: 'please input a correct DayZ Server folder path',
                    serverFolderPath: 'please input a pure and correct folder path'
                }
            }
        }
    },
    ModChooseView: {
        pageTitle: 'Mod Choose',
        createNext: 'Create',
        updateNext: 'Update',
        back: 'Back',
        subscriptionTitle: 'Mods Subscribed',
        additionalTitle: 'Mods Added',
        searchInputPlaceHolder: 'input the name of mod',
        tableTitle: {
            id: 'ID',
            name: 'Name',
            mapAction: 'Map',
            action: 'Action',
        },
        emptyText: 'No Mod found',
        createConfirm: 'Are you sure to start create the server?',
        updateConfirm: 'Are you sure to start update the server?',
        updateWarning: 'Please add MOD which you want'
    },
    EditServerView: {
        next: 'Next',
        back: 'Back',
        pageTitle: {
            create: 'Create Server',
            update: 'Update Server'
        },
        copyingContent: "({percent}%) copying {src} to {dest}",
        fileFound: "Calculating...({processFileCount} of files be found)",
        stagesTitle: {
            copy_pure_dayz_server_file_to_target_path: 'copying pure DayZ Server',
            copy_addons_to_target_path: 'copying Addons',
            copy_keys_to_target_path: 'copying Keys',
            copy_mods_to_target_path: 'copying MOD',
            create_server_profile_folder: 'creating server profile folder',
            edit_start_up_file: 'editing startup file',
            edit_server_dz_cfg_file: 'editing serverDZ.cfg file',
            completed: 'completed'
        }
    },
    ModMountConfigView: {
        next: 'Run',
        completedNext: 'Finish',
        back: 'Back',
        pageTitle: 'Set Mod',
        copyingContent: "({percent}%) copying {src} to {dest}",
        fileFound: "Calculating...({processFileCount} of files be found)",
        mainContent: {
            normalText1:'Please categorize each config file under the paths below',
            importantText: 'Paht to your DayZServer\/id-＠modname\/DAYZ_MOD_SETUP_TOOL_CREATED\/',
            normalText2:'If you already completed, Just run',
            attention: 'Note: The current version only supports types.xml, spawnabletypes.xml, globals.xml, economy.xml, events.xml, messages.xml'
        },
        stagesTitle: {
            copy_missions_file_to_target_path: 'copying missions file',
            copy_mod_config_xml_to_target_path: 'copying the xml files of mods',
            completed: 'completed'
        }
    },
    LogListView: {
        pageTitle: 'Logs',
        logListTitle: {
            logType: 'Type',
            logContent: 'Content',
            logTime: 'Time'
        },
        back: 'Back',
        noData: 'No Data Found'
    },
    SettingsView: {
        pageTitle: 'Settings',
        language: {
            title: 'Language',
            zh_CN: '简体中文',
            en_US: 'English',
            ja_JP: '日本語',
        },
        RelatedPaths: {
            title: 'Related path',
            osUserName: 'OS User',
            presetFileFolderPath: 'Preset File Folder Path',
            dayZLauncherFolderPath: 'DayZ Launcher Data Path',
            pathCheck: 'Path Check',
            pathCheckSuccess: 'Path Check Success',
            pathChecking: 'Path Checking',
            recheck: 'Re-Check',
            pathCheckFailed: 'Path Check Failed',
            workShopFolderPath: '!WorkShop Folder Path',
        },
        apply: 'Apply',
        back: 'Back'
    },
    InitializationView: {
        checking: 'Checking...',
        checkSuccess: 'Check Successfully',
        checkFailed: 'Check Failed',
        messageBoxOkBtn: 'OK',
        messageContent: 'Check Failed, Please input the path necessary',
    }
}
