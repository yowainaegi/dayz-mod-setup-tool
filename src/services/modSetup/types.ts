import ModInfo from "@/server/models/ModInfo";
import ServerConfigFile from "@/server/models/ServerConfigFile";
import { CE_CONFIG_TYPES, TASK_MODE } from "./constants";

type TaskMode = typeof TASK_MODE[keyof typeof TASK_MODE];
type CeConfigType = typeof CE_CONFIG_TYPES[number];

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

interface ModCeFileCandidate {
    modId?: string;
    modName?: string;
    modFolderName: string;
    sourcePath: string;
    relativePath: string;
    fileName: string;
    detectedType?: CeConfigType;
    selectedType?: CeConfigType;
    confidence: 'high' | 'medium' | 'low' | 'ignored';
    enabled: boolean;
    isConfirmed?: boolean;
    confirmedType?: CeConfigType;
    createdCopyPath?: string;
    mountSourcePath?: string;
    mountKind?: 'economycore';
    processStatus?: 'waiting_to_mount' | 'processed' | 'ignored' | 'unprocessed';
    isUserProcessed?: boolean;
    warning?: string;
    reason?: string;
}

interface ModCeMountItem {
    modFolderName: string;
    sourcePath: string;
    fileName: string;
    selectedType: CeConfigType;
    mountKind: 'economycore';
}

interface MapMissionCandidate {
    modFolderName: string;
    missionFolderName: string;
    sourcePath: string;
    isImported?: boolean;
    importedAt?: string;
}

interface MissionDecisionState {
    selectedMission?: {
        modFolderName: string;
        missionFolderName: string;
        sourcePath?: string;
        isImported?: boolean;
        updatedAt: string;
    };
    ignoredTerrainModNames: string[];
    processedTerrainModNames: string[];
}

interface MissionSelection {
    missionFolderName: string;
    sourcePath?: string;
    updateServerConfig?: boolean;
}

type TerrainConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

interface TerrainResourceDetection {
    modFolderName: string;
    isTerrainResourceMod: boolean;
    confidence: TerrainConfidence;
    matchedPbos: string[];
    reasons: string[];
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
    mountItems?: ModCeMountItem[];
    missionSelection?: MissionSelection;
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
    CeConfigType,
    ModCeFileCandidate,
    ModCeMountItem,
    MapMissionCandidate,
    MissionDecisionState,
    MissionSelection,
    TerrainConfidence,
    TerrainResourceDetection,
    ModMountStageTitles,
    ModMountWorkflowParams
};
