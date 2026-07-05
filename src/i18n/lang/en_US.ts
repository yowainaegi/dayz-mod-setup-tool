export default {
    common: {
        modal: {
            confirm: {
                title: 'Confirm',
                yes: 'Yes',
                cancel: 'Cancel'
            },
            warning: {
                title: 'Notice'
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
        configStatus: {
            draft: 'Draft',
            workspace_ready: 'Workspace Ready',
            server_created: 'Server Created',
            ce_mounted: 'CE Mounted',
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
        chooseConfigFileCheck: 'Please choose a config file',
        workflowDialogs: {
            enterUpdateTitle: 'Enter update flow?',
            enterUpdateMessage: 'This config has already completed server creation. Running Create again may overwrite the existing server files. Do you want to switch to Update and edit the existing server instead?',
            enterUpdateConfirm: 'Enter Update',
            enterCreateTitle: 'Enter create flow?',
            enterCreateMessage: 'This config has not completed server creation yet. Update would skip the initial pure server copy. Do you want to switch to Create and finish the initial setup first?',
            enterCreateConfirm: 'Enter Create',
            missingWorkspaceMessage: 'Server folder path is empty.',
            replacePresetTitle: 'Import new preset changes?',
            replacePresetCompletedMessage: 'The new preset will be read and its added/removed mods will be shown on the Mod Choose page. Removed mods will have tool-managed mounts cleaned up, but you still need to check manual configuration. Continue?',
            replacePresetMessage: 'The new preset will be read and shown as added/removed mod changes. The current working preset will not be overwritten directly.',
            replacePresetConfirm: 'Import changes',
        }
    },
    ConfigFileEditView: {
        pageTitle: 'Config file setup',
        save: 'Save',
        back: 'Back',
        status: 'Status',
        resetStatus: 'Reset Status',
        statusResetSuccess: 'Status reset successfully',
        modMountMode: 'Mod mount mode',
        modMountModeOptions: {
            copy: 'Copy mod files',
            junction: 'Use directory links',
        },
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
        updateWarning: 'Please add MOD which you want',
        dependencyConfirmTitle: 'Dependency mods required',
        dependencyConfirmMessage: '{modName} depends on these mods. Add them together?\n{dependencies}',
        dependencySelectionConfirmMessage: 'The currently added mods are missing these dependencies. Add them together?\n{dependencies}',
        dependencySelectionInvalid: 'The currently added mods are missing these dependencies, but they are not in the current subscribed list:\n{dependencies}',
        dependencyMissingUnavailable: '{modName} requires these dependency mods, but they are not in the current subscribed list:\n{dependencies}',
        dependencyRemoveBlocked: 'Cannot remove {modName}. These added mods depend on it:\n{dependents}',
        removeExistingModConfirmTitle: 'Remove deployed mod?',
        removeExistingModConfirmMessage: 'Removing {modName} during update will delete its server mod folder and clean tool-managed CE/mission references. You still need to check and remove related manual configuration. Continue?'
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
        mount: 'Mount',
        done: 'Done',
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
        },
        summary: {
            total: 'Total',
            enabled: 'Enabled',
            needReview: 'Need review',
            mission: 'Mission',
            selectMission: 'Select mission',
        },
        mission: {
            title: 'Mission / Terrain',
            conflictWarning: 'Multiple terrain mods detected. Select one mission or handle the others.',
            configured: 'configured',
            imported: 'imported',
            serverDefault: 'server/default',
            notFound: 'Not Found',
            selectTemplateFolder: 'Select DayZ mission template folder',
        },
        table: {
            mod: 'Mod',
            terrainResource: 'Confidence',
            mission: 'Mission',
            status: 'Status',
            reason: 'Reason',
            action: 'Action',
            mods: 'Mods',
            candidateXmlFiles: 'Candidate XML Files',
            selected: 'Selected',
            select: 'Select',
            file: 'File',
            ceType: 'CE Type',
            confidence: 'Confidence',
            empty: 'No CE config candidates.',
        },
        actions: {
            useThisMission: 'Use This Mission',
            import: 'Import',
            ignore: 'Ignore',
            unignore: 'Unignore',
            process: 'Process',
            unprocess: 'Unprocess',
            reselect: 'Reselect',
            selectVisible: 'Select Visible',
            clear: 'Clear',
            preview: 'Preview',
            edit: 'Edit',
            continue: 'Continue',
        },
        status: {
            selected: 'selected',
            ready: 'mission ready',
            conflict: 'conflict',
            missing: 'mission missing',
            ignored: 'ignored',
            processed: 'processed',
            unprocessed: 'unprocessed',
            waiting_to_mount: 'waiting to mount',
        },
        confidence: {
            high: 'High',
            medium: 'Medium',
            low: 'Low',
            ignored: 'Ignored',
        },
        reasons: {
            ignoredByUser: 'Ignored by user',
            processedByUser: 'Processed by user',
            selectedMission: 'Selected as server mission',
            missionMissing: 'Mission template not found',
            missionConflict: 'Multiple terrain missions are available; select one or handle the others',
            missionReady: 'Mission template found',
        },
        xmlReasons: {
            noCeRootTagFound: 'No CE root tag found',
            unofficialCeFileName: 'XML file name is not an official CE file name',
            cfgeconomycoreIndexFile: 'cfgeconomycore.xml is a CE index file, not a mount target',
            needsUserReview: 'Needs user review',
            manualCopyOrMergeRequired: 'Manual copy or merge required',
            ignoredByUser: 'Ignored by user',
            processedByUser: 'Processed by user',
        },
        errors: {
            serverFolderEmpty: 'server_folder_path is empty',
            unprocessedFiles: 'There are unprocessed files. Process or ignore them before finishing.',
            unprocessedMission: 'There are unprocessed mission/terrain items. Select one mission, import the missing template, process, or ignore them before mounting.',
        },
        dialogs: {
            mountHighConfidenceTitle: 'Mount high confidence files',
            mountHighConfidenceMessage: 'Will mount {mountCount} high confidence file(s). {skippedCount} medium/low/ignored file(s) will be skipped.',
        }
    },
    TextFilePreviewView: {
        source: 'Source',
        savedCopy: 'Saved Copy',
        openContainingFolder: 'Open containing folder',
        editToolCopy: 'Edit tool copy',
        truncatedWarning: 'File is larger than 2MB. Showing the first 2MB only.',
    },
    TextFileEditorView: {
        source: 'Source',
        savedCopy: 'Saved Copy',
        editingSavedCopy: 'Editing Saved Copy',
        formatXml: 'Format XML',
        revert: 'Revert',
        save: 'Save',
        xmlFormatFailed: 'XML format failed',
        saveSuccess: 'Saved to {path}',
        saveFailed: 'Save failed',
        revertConfirmTitle: 'Revert to source?',
        revertConfirmMessage: 'This will delete the saved copy in DAYZ_MOD_SETUP_TOOL_CREATED and restore this file to the original source content.',
        revertSuccess: 'Reverted to source file',
        revertFailed: 'Revert failed',
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
