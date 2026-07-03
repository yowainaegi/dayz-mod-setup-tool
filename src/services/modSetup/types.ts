import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { TASK_MODE } from "./constants";

type TaskMode = typeof TASK_MODE[keyof typeof TASK_MODE];

interface WorkflowProgressCallbacks {
    receiveIpc: (channel: string, listener: (...args: any[]) => void) => void;
    onProgressChange: (progress: number) => void;
    onStageTitleChange: (stageTitle: string) => void;
    onCopyingFileChange: (srcPath: string | null, targetPath: string | null) => void;
    onFileCountIncrement: (count: number) => void;
    onFileCountReset: () => void;
    onCountingChange: (isCounting: boolean) => void;
}

interface ServerSetupStageTitles {
    copyPureServer: string;
    copyKeys: string;
    copyMods: string;
    createProfile: string;
    editStartup: string;
    editServerCfg: string;
    completed: string;
}

interface ServerSetupWorkflowParams extends WorkflowProgressCallbacks {
    configFile: ServerConfigFile;
    modList: ModInfo[];
    mode: TaskMode;
    stageTitles: ServerSetupStageTitles;
}

interface ServerSetupWorkflowResult {
    createdFolderPathMap: Map<string, string[]>;
}

interface ModCopyItem {
    id: string;
    sourcePath: string;
    folderName: string;
    targetPath: string;
    createdConfigRootPath: string;
    isMapMod: boolean;
}

interface CreatedConfigFolder {
    type: string;
    path: string;
    isMapMissions: boolean;
}

interface CreatedModConfig {
    modFolderName: string;
    createdRootPath: string;
    configFolders: CreatedConfigFolder[];
}

interface NormalConfigFolder extends CreatedConfigFolder {
    modFolderName: string;
}

interface ModMountStageTitles {
    copyMissions: string;
    copyModConfigXml: string;
    completed: string;
}

interface ModMountWorkflowParams extends WorkflowProgressCallbacks {
    configFile: ServerConfigFile;
    createdFolderPathMap: Map<string, string[]>;
    stageTitles: ModMountStageTitles;
}

export type {
    TaskMode,
    WorkflowProgressCallbacks,
    ServerSetupStageTitles,
    ServerSetupWorkflowParams,
    ServerSetupWorkflowResult,
    ModCopyItem,
    CreatedConfigFolder,
    CreatedModConfig,
    NormalConfigFolder,
    ModMountStageTitles,
    ModMountWorkflowParams
};
