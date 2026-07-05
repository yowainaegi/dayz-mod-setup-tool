import os from "os";
import fs from "fs";
import path from "path";
import { STATUS_CODE } from "../models/Constant";
import ResData from "../models/ResData";
import { app } from "electron";
import { jsonStringfyToIPCMAINError } from "@/utils/Util";
import { CE_CONFIG_TYPES, CREATED_CONFIG_FOLDER_NAME } from "@/services/modSetup/constants";
// import puppeteer from "puppeteer";


/**
 * 系统分隔符
 */
const PATH_SEP = path.sep;

type CeConfigType = typeof CE_CONFIG_TYPES[number];

const XML_FILE_TYPE_RULES: Array<{ pattern: RegExp; type: CeConfigType }> = [
    { pattern: /(^|[^a-z])cfgspawnabletypes\.xml$/i, type: 'spawnabletypes' },
    { pattern: /(^|[^a-z])spawnabletypes\.xml$/i, type: 'spawnabletypes' },
    { pattern: /(^|[^a-z])types\.xml$/i, type: 'types' },
    { pattern: /(^|[^a-z])globals\.xml$/i, type: 'globals' },
    { pattern: /(^|[^a-z])economy\.xml$/i, type: 'economy' },
    { pattern: /(^|[^a-z])events\.xml$/i, type: 'events' },
    { pattern: /(^|[^a-z])messages\.xml$/i, type: 'messages' }
];

const XML_ROOT_TYPE_MAP: Record<string, CeConfigType> = {
    types: 'types',
    spawnabletypes: 'spawnabletypes',
    globals: 'globals',
    economy: 'economy',
    events: 'events',
    messages: 'messages'
};

const EXACT_CE_FILE_NAME_TYPE_MAP: Record<string, CeConfigType> = {
    'types.xml': 'types',
    'cfgspawnabletypes.xml': 'spawnabletypes',
    'spawnabletypes.xml': 'spawnabletypes',
    'globals.xml': 'globals',
    'economy.xml': 'economy',
    'events.xml': 'events',
    'messages.xml': 'messages'
};

const SKIP_SCAN_FOLDER_NAMES = new Set([
    CREATED_CONFIG_FOLDER_NAME.toLowerCase(),
    'keys',
    'key',
    'addons'
]);

const MOD_LINK_EXCLUDED_NAMES = new Set([
    CREATED_CONFIG_FOLDER_NAME.toLowerCase(),
    'keys',
    'key'
]);

const MOD_LINKED_FOLDER_NAMES = new Set([
    'addons'
]);

const MOD_LINKED_FILE_NAMES = new Set([
    'mod.cpp',
    'meta.cpp'
]);

const SCAN_EXCLUDED_FILE_NAMES = new Set([
    'mod.cpp',
    'meta.cpp'
]);

const MAX_SUSPICIOUS_FILE_SIZE = 1024 * 1024;
const XML_ROOT_READ_BYTES = 4096;
const CE_MANUAL_CONFIRMATIONS_FILE_NAME = '.ce-manual-confirmations.json';
const CE_IGNORED_CANDIDATES_FILE_NAME = '.ce-ignored-candidates.json';
const CE_PROCESSED_CANDIDATES_FILE_NAME = '.ce-processed-candidates.json';
const MISSION_IMPORTS_FILE_NAME = '.mission-imports.json';
const MISSION_DECISIONS_FILE_NAME = '.mission-decisions.json';
const PRESET_WORKSPACE_FOLDER_NAME = 'presets';
const ACTIVE_PRESET_FILE_NAME = 'active.preset2';
const PRESET_SOURCE_INFO_FILE_NAME = 'source-info.json';
const GENERATED_PRESET_SOURCE_NAME = 'DayZ Mod Setup Tool';
const CFG_ECONOMY_CORE_FILE_NAMES = new Set([
    'cfgeconomycore.xml',
    'cfgeconomycore.xml'.toLowerCase()
]);

interface CeManualConfirmation {
    sourceRelativePath: string;
    sourcePath: string;
    ceType: CeConfigType;
    fileName: string;
    createdCopyPath: string;
    updatedAt: string;
}

interface CeIgnoredCandidate {
    sourceRelativePath: string;
    sourcePath: string;
    reason: string;
    updatedAt: string;
}

interface CeProcessedCandidate {
    sourceRelativePath: string;
    sourcePath: string;
    reason: string;
    updatedAt: string;
}

interface MapMissionCandidate {
    modFolderName: string;
    missionFolderName: string;
    sourcePath: string;
    isImported?: boolean;
    importedAt?: string;
}

type TerrainConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

interface TerrainResourceDetection {
    modFolderName: string;
    isTerrainResourceMod: boolean;
    confidence: TerrainConfidence;
    matchedPbos: string[];
    reasons: string[];
}

interface MissionImportRecord {
    modFolderName: string;
    missionFolderName: string;
    sourcePath: string;
    importedPath: string;
    importedAt: string;
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

interface PresetSourceInfo {
    sourcePresetFileName: string;
    sourcePresetFilePath: string;
    activePresetPath: string;
    updatedAt: string;
}

/**
 * 获取系统分隔符
 */
const getPathSep = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        try {
            const resData: ResData = {
                statusCode: STATUS_CODE.SUCCESS,
                data: PATH_SEP
            }
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: error.message
            }
           reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

/**
 * 获取系统用户名
 */
const  getOsUserName = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        try {
            const resData: ResData = {
                statusCode: STATUS_CODE.SUCCESS,
                data: os.userInfo().username
            }
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            const resData: ResData = {
                statusCode: STATUS_CODE.API_ERROR,
                data: error.message
            }
           reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

/**
 * 获取文件夹路径
 */
const getDirectoryPath = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }
        fs.opendir(path, (err: any, dir: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = dir.path;
                dir.close((closeErr: any) => {
                    if(closeErr) {
                        resData.statusCode = STATUS_CODE.API_ERROR;
                        resData.data = closeErr.message;
                    }
                });
                resolve(JSON.stringify(resData));
            }
        })
    })
}

/**
 * 根据文件夹路径获取所有该路径下的文件对象
 */
const getFileNameList = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }

        fs.readdir(path, {encoding: 'utf-8', withFileTypes: true, recursive: false}, (err: any, files: any[]) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = files;
                resolve(JSON.stringify(resData));
            }
        });
    })
}

/**
 * 读取文件内容
 */
const getFileContent = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }

        fs.readFile(path, {encoding: 'utf-8'}, (err: any, data: string) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = data;
                resolve(JSON.stringify(resData));
            }
        });
    })
}

function detectCeTypeByFileName(fileName: string): CeConfigType | undefined {
    const lowerFileName = fileName.toLowerCase();
    return EXACT_CE_FILE_NAME_TYPE_MAP[lowerFileName]
        || XML_FILE_TYPE_RULES.find((rule) => rule.pattern.test(lowerFileName))?.type;
}

function detectCeTypeByXmlRoot(filePath: string): { directType?: CeConfigType; matchedType?: CeConfigType } {
    try {
        const content = readFileHead(filePath, XML_ROOT_READ_BYTES);
        return detectCeTypeByXmlContent(content);
    } catch {
        return {};
    }
}

function detectCeTypeByXmlContent(content: string): { directType?: CeConfigType; matchedType?: CeConfigType } {
    const directRootName = getDirectXmlRootName(content);
    const match = content.match(/<\s*(types|spawnabletypes|globals|economy|events|messages)(\s|>|\/)/i);
    const directType = directRootName ? XML_ROOT_TYPE_MAP[directRootName] : undefined;
    const matchedType = match ? XML_ROOT_TYPE_MAP[match[1].toLowerCase()] : undefined;
    return { directType, matchedType };
}

function getDirectXmlRootName(content: string): string | undefined {
    let normalizedContent = content.replace(/^\uFEFF/, '').trimStart();
    normalizedContent = normalizedContent.replace(/^<\?xml[\s\S]*?\?>/i, '').trimStart();

    let previousContent = '';
    while (previousContent !== normalizedContent) {
        previousContent = normalizedContent;
        normalizedContent = normalizedContent.replace(/^<!--[\s\S]*?-->/, '').trimStart();
    }

    const match = normalizedContent.match(/^<\s*([a-zA-Z0-9_:-]+)(\s|>|\/)/);
    return match ? (match[1].split(':').pop()?.toLowerCase() || undefined) : undefined;
}

function readFileHead(filePath: string, byteLength: number): string {
    const fd = fs.openSync(filePath, 'r');
    try {
        const buffer = Buffer.alloc(byteLength);
        const bytesRead = fs.readSync(fd, buffer, 0, byteLength, 0);
        return buffer.subarray(0, bytesRead).toString('utf-8');
    } finally {
        fs.closeSync(fd);
    }
}

function canReadFileHead(filePath: string): boolean {
    try {
        const stat = fs.statSync(filePath);
        return stat.size <= MAX_SUSPICIOUS_FILE_SIZE;
    } catch {
        return false;
    }
}

function getCreatedConfigRootPath(serverFolderPath: string, modFolderName: string): string {
    return path.join(serverFolderPath, modFolderName, CREATED_CONFIG_FOLDER_NAME);
}

function getCeConfirmationManifestPath(serverFolderPath: string, modFolderName: string): string {
    return path.join(getCreatedConfigRootPath(serverFolderPath, modFolderName), CE_MANUAL_CONFIRMATIONS_FILE_NAME);
}

function getCeIgnoredCandidatesManifestPath(serverFolderPath: string, modFolderName: string): string {
    return path.join(getCreatedConfigRootPath(serverFolderPath, modFolderName), CE_IGNORED_CANDIDATES_FILE_NAME);
}

function getCeProcessedCandidatesManifestPath(serverFolderPath: string, modFolderName: string): string {
    return path.join(getCreatedConfigRootPath(serverFolderPath, modFolderName), CE_PROCESSED_CANDIDATES_FILE_NAME);
}

function getMissionImportsManifestPath(serverFolderPath: string): string {
    return path.join(serverFolderPath, CREATED_CONFIG_FOLDER_NAME, MISSION_IMPORTS_FILE_NAME);
}

function getMissionDecisionsManifestPath(serverFolderPath: string): string {
    return path.join(serverFolderPath, CREATED_CONFIG_FOLDER_NAME, MISSION_DECISIONS_FILE_NAME);
}

function getPresetWorkspaceFolderPath(serverFolderPath: string): string {
    return path.join(serverFolderPath, CREATED_CONFIG_FOLDER_NAME, PRESET_WORKSPACE_FOLDER_NAME);
}

function getActivePresetPath(serverFolderPath: string): string {
    return path.join(getPresetWorkspaceFolderPath(serverFolderPath), ACTIVE_PRESET_FILE_NAME);
}

function getPresetSourceInfoPath(serverFolderPath: string): string {
    return path.join(getPresetWorkspaceFolderPath(serverFolderPath), PRESET_SOURCE_INFO_FILE_NAME);
}

function readPresetSourceInfo(serverFolderPath: string): PresetSourceInfo | null {
    const sourceInfoPath = getPresetSourceInfoPath(serverFolderPath);
    if (!fs.existsSync(sourceInfoPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(sourceInfoPath, 'utf-8')) as PresetSourceInfo;
    } catch {
        return null;
    }
}

function writePresetSourceInfo(serverFolderPath: string, sourcePresetPath: string, activePresetPath: string): PresetSourceInfo {
    const sourceInfo: PresetSourceInfo = {
        sourcePresetFileName: path.basename(sourcePresetPath),
        sourcePresetFilePath: sourcePresetPath,
        activePresetPath,
        updatedAt: new Date().toISOString()
    };
    fs.mkdirSync(path.dirname(getPresetSourceInfoPath(serverFolderPath)), { recursive: true });
    fs.writeFileSync(getPresetSourceInfoPath(serverFolderPath), JSON.stringify(sourceInfo, null, 2), 'utf-8');
    return sourceInfo;
}

function buildPresetXml(modIds: string[] = []): string {
    const uniqueIds = Array.from(new Set(modIds.map((id) => id.trim()).filter(Boolean)));
    return [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<addons-presets>',
        `  <last-update>${new Date().toISOString()}</last-update>`,
        '  <published-ids>',
        ...uniqueIds.map((id) => `    <id>${id.startsWith('steam:') ? id : `steam:${id}`}</id>`),
        '  </published-ids>',
        '</addons-presets>'
    ].join('\n');
}

function readCeManualConfirmations(serverFolderPath: string, modFolderName: string): CeManualConfirmation[] {
    const manifestPath = getCeConfirmationManifestPath(serverFolderPath, modFolderName);
    if (!fs.existsSync(manifestPath)) {
        return [];
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeCeManualConfirmations(serverFolderPath: string, modFolderName: string, confirmations: CeManualConfirmation[]): void {
    const manifestPath = getCeConfirmationManifestPath(serverFolderPath, modFolderName);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(confirmations, null, 2), 'utf-8');
}

function buildCeManualConfirmationMap(serverFolderPath: string, modFolderName: string): Map<string, CeManualConfirmation> {
    const confirmationMap = new Map<string, CeManualConfirmation>();
    for (const confirmation of readCeManualConfirmations(serverFolderPath, modFolderName)) {
        if (confirmation.sourceRelativePath && confirmation.createdCopyPath && fs.existsSync(confirmation.createdCopyPath)) {
            confirmationMap.set(confirmation.sourceRelativePath, confirmation);
        }
    }
    return confirmationMap;
}

function readCeIgnoredCandidates(serverFolderPath: string, modFolderName: string): CeIgnoredCandidate[] {
    const manifestPath = getCeIgnoredCandidatesManifestPath(serverFolderPath, modFolderName);
    if (!fs.existsSync(manifestPath)) {
        return [];
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeCeIgnoredCandidates(serverFolderPath: string, modFolderName: string, ignoredCandidates: CeIgnoredCandidate[]): void {
    const manifestPath = getCeIgnoredCandidatesManifestPath(serverFolderPath, modFolderName);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(ignoredCandidates, null, 2), 'utf-8');
}

function readCeProcessedCandidates(serverFolderPath: string, modFolderName: string): CeProcessedCandidate[] {
    const manifestPath = getCeProcessedCandidatesManifestPath(serverFolderPath, modFolderName);
    if (!fs.existsSync(manifestPath)) {
        return [];
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeCeProcessedCandidates(serverFolderPath: string, modFolderName: string, processedCandidates: CeProcessedCandidate[]): void {
    const manifestPath = getCeProcessedCandidatesManifestPath(serverFolderPath, modFolderName);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(processedCandidates, null, 2), 'utf-8');
}

function readMissionImports(serverFolderPath: string): MissionImportRecord[] {
    const manifestPath = getMissionImportsManifestPath(serverFolderPath);
    if (!fs.existsSync(manifestPath)) {
        return [];
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeMissionImports(serverFolderPath: string, records: MissionImportRecord[]): void {
    const manifestPath = getMissionImportsManifestPath(serverFolderPath);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(records, null, 2), 'utf-8');
}

function normalizeMissionDecisionState(parsed: any): MissionDecisionState {
    return {
        selectedMission: parsed?.selectedMission,
        ignoredTerrainModNames: Array.isArray(parsed?.ignoredTerrainModNames) ? parsed.ignoredTerrainModNames : [],
        processedTerrainModNames: Array.isArray(parsed?.processedTerrainModNames) ? parsed.processedTerrainModNames : []
    };
}

function readMissionDecisionState(serverFolderPath: string): MissionDecisionState {
    const manifestPath = getMissionDecisionsManifestPath(serverFolderPath);
    if (!fs.existsSync(manifestPath)) {
        return normalizeMissionDecisionState(null);
    }

    try {
        return normalizeMissionDecisionState(JSON.parse(fs.readFileSync(manifestPath, 'utf-8')));
    } catch {
        return normalizeMissionDecisionState(null);
    }
}

function writeMissionDecisionState(serverFolderPath: string, state: MissionDecisionState): MissionDecisionState {
    const nextState = normalizeMissionDecisionState(state);
    const manifestPath = getMissionDecisionsManifestPath(serverFolderPath);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(nextState, null, 2), 'utf-8');
    return nextState;
}

function isPathInside(parentPath: string, childPath: string): boolean {
    const resolvedParent = path.resolve(parentPath);
    const resolvedChild = path.resolve(childPath);
    return resolvedChild === resolvedParent || resolvedChild.startsWith(`${resolvedParent}${path.sep}`);
}

function removeDirectoryInside(serverFolderPath: string, targetPath: string): void {
    if (!isPathInside(serverFolderPath, targetPath) || !fs.existsSync(targetPath)) {
        return;
    }

    fs.rmSync(targetPath, { recursive: true, force: true });
}

function ceFolderBelongsToRemovedMod(folder: string, modFolderNames: Set<string>): boolean {
    const normalizedFolder = folder.replace(/\\/g, '/');
    for (const modFolderName of modFolderNames) {
        if (
            normalizedFolder === modFolderName
            || normalizedFolder.startsWith(`${modFolderName}/`)
            || normalizedFolder.startsWith(`${CREATED_CONFIG_FOLDER_NAME}/${modFolderName}/`)
        ) {
            return true;
        }
    }

    return false;
}

function removeRemovedModCeRefsFromContent(content: string, modFolderNames: Set<string>): string {
    return content
        .replace(/<ce\b[^>]*\bfolder="([^"]+)"[^>]*>[\s\S]*?<\/ce>/gi, (match, folder) => {
            return ceFolderBelongsToRemovedMod(folder, modFolderNames) ? '' : match;
        })
        .replace(/<ce\b[^>]*\bfolder="([^"]+)"[^>]*\/>/gi, (match, folder) => {
            return ceFolderBelongsToRemovedMod(folder, modFolderNames) ? '' : match;
        });
}

function cleanupMissionReferencesForRemovedMods(serverFolderPath: string, modFolderNames: string[]): void {
    const removedModNames = new Set(modFolderNames);
    const mpmissionsPath = path.join(serverFolderPath, 'mpmissions');
    if (!fs.existsSync(mpmissionsPath)) {
        return;
    }

    const missionEntries = fs.readdirSync(mpmissionsPath, { withFileTypes: true });
    for (const missionEntry of missionEntries) {
        if (!missionEntry.isDirectory()) {
            continue;
        }

        const missionPath = path.join(mpmissionsPath, missionEntry.name);
        for (const modFolderName of modFolderNames) {
            removeDirectoryInside(serverFolderPath, path.join(missionPath, CREATED_CONFIG_FOLDER_NAME, modFolderName));
            removeDirectoryInside(serverFolderPath, path.join(missionPath, modFolderName));
        }

        const economyCorePath = path.join(missionPath, 'cfgeconomycore.xml');
        if (fs.existsSync(economyCorePath)) {
            const content = fs.readFileSync(economyCorePath, 'utf-8');
            const nextContent = removeRemovedModCeRefsFromContent(content, removedModNames);
            if (nextContent !== content) {
                fs.writeFileSync(economyCorePath, nextContent, 'utf-8');
            }
        }
    }
}

function cleanupRemovedModState(serverFolderPath: string, modFolderNames: string[]): void {
    const removedModNames = new Set(modFolderNames);
    writeMissionImports(
        serverFolderPath,
        readMissionImports(serverFolderPath).filter((record) => !removedModNames.has(record.modFolderName))
    );

    const missionDecisionState = readMissionDecisionState(serverFolderPath);
    if (missionDecisionState.selectedMission && removedModNames.has(missionDecisionState.selectedMission.modFolderName)) {
        delete missionDecisionState.selectedMission;
    }
    writeMissionDecisionState(serverFolderPath, {
        ...missionDecisionState,
        ignoredTerrainModNames: missionDecisionState.ignoredTerrainModNames.filter((name) => !removedModNames.has(name)),
        processedTerrainModNames: missionDecisionState.processedTerrainModNames.filter((name) => !removedModNames.has(name))
    });
}

function buildCeIgnoredCandidateMap(serverFolderPath: string, modFolderName: string): Map<string, CeIgnoredCandidate> {
    const ignoredMap = new Map<string, CeIgnoredCandidate>();
    for (const ignoredCandidate of readCeIgnoredCandidates(serverFolderPath, modFolderName)) {
        if (ignoredCandidate.sourceRelativePath) {
            ignoredMap.set(ignoredCandidate.sourceRelativePath, ignoredCandidate);
        }
    }
    return ignoredMap;
}

function buildCeProcessedCandidateMap(serverFolderPath: string, modFolderName: string): Map<string, CeProcessedCandidate> {
    const processedMap = new Map<string, CeProcessedCandidate>();
    for (const processedCandidate of readCeProcessedCandidates(serverFolderPath, modFolderName)) {
        if (processedCandidate.sourceRelativePath) {
            processedMap.set(processedCandidate.sourceRelativePath, processedCandidate);
        }
    }
    return processedMap;
}

function getSourceRelativePath(serverFolderPath: string, modFolderName: string, sourcePath: string): string {
    const modFolderPath = path.join(serverFolderPath, modFolderName);
    const sourceRelativePath = path.relative(modFolderPath, sourcePath);
    if (sourceRelativePath.startsWith('..') || path.isAbsolute(sourceRelativePath)) {
        throw new Error('Source file is not inside the selected mod folder');
    }
    return sourceRelativePath;
}

function isValidMissionFolder(missionPath: string): boolean {
    try {
        const entries = fs.readdirSync(missionPath, { withFileTypes: true });
        const names = new Set(entries.map((entry) => entry.name.toLowerCase()));
        return names.has('init.c') && names.has('db');
    } catch {
        return false;
    }
}

function collectMapMissionCandidatesFromFolder(modFolderName: string, mapMissionsPath: string): MapMissionCandidate[] {
    if (!fs.existsSync(mapMissionsPath)) {
        return [];
    }

    const candidates: MapMissionCandidate[] = [];
    const entries = fs.readdirSync(mapMissionsPath, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.includes('.')) {
            continue;
        }

        const missionPath = path.join(mapMissionsPath, entry.name);
        if (!isValidMissionFolder(missionPath)) {
            continue;
        }

        candidates.push({
            modFolderName,
            missionFolderName: entry.name,
            sourcePath: missionPath
        });
    }

    return candidates;
}

function detectTerrainResourceMod(serverFolderPath: string, modFolderName: string): TerrainResourceDetection {
    const addonsPath = path.join(serverFolderPath, modFolderName, 'Addons');
    const matchedPbos: string[] = [];
    if (fs.existsSync(addonsPath)) {
        try {
            const entries = fs.readdirSync(addonsPath, { withFileTypes: true });
            const targetNames = new Set(['world.pbo', 'navmesh.pbo', 'surfaces.pbo', 'ce.pbo']);
            for (const entry of entries) {
                if (entry.isFile() && targetNames.has(entry.name.toLowerCase())) {
                    matchedPbos.push(entry.name.toLowerCase());
                }
            }
        } catch {
            // Unreadable Addons folders are treated as no terrain signal.
        }
    }

    const matchedSet = new Set(matchedPbos);
    const hasWorld = matchedSet.has('world.pbo');
    const hasNavmesh = matchedSet.has('navmesh.pbo');
    const hasSurfaces = matchedSet.has('surfaces.pbo');
    const hasCe = matchedSet.has('ce.pbo');
    let confidence: TerrainConfidence = 'NONE';

    if (
        (hasWorld && hasNavmesh) ||
        (hasWorld && hasSurfaces) ||
        (hasWorld && hasCe)
    ) {
        confidence = 'HIGH';
    } else if (
        hasWorld ||
        hasNavmesh ||
        (hasNavmesh && hasCe) ||
        (hasSurfaces && hasCe)
    ) {
        confidence = 'MEDIUM';
    } else if (hasCe || hasSurfaces) {
        confidence = 'LOW';
    }

    const reasons = matchedPbos.map((pboName) => `Addons/${pboName} found`);
    if (reasons.length === 0) {
        reasons.push('No terrain resource PBO signal found');
    }

    return {
        modFolderName,
        isTerrainResourceMod: confidence !== 'NONE',
        confidence,
        matchedPbos,
        reasons
    };
}

function normalizeCeCopyFileName(sourcePath: string): string {
    const parsedPath = path.parse(sourcePath);
    return parsedPath.ext.toLowerCase() === '.xml'
        ? parsedPath.base
        : `${parsedPath.name}.xml`;
}

function getXmlConfigMountKind(configType?: CeConfigType): 'economycore' | undefined {
    if (!configType) {
        return undefined;
    }
    if ((CE_CONFIG_TYPES as readonly string[]).includes(configType)) {
        return 'economycore';
    }
    return undefined;
}

function collectXmlCandidates(
    serverFolderPath: string,
    modFolderName: string,
    folderPath: string,
    candidates: any[],
    visitedFolders: Set<string>,
    confirmationMap: Map<string, CeManualConfirmation>,
    ignoredMap: Map<string, CeIgnoredCandidate>,
    processedMap: Map<string, CeProcessedCandidate>
): void {
    const realFolderPath = fs.realpathSync(folderPath);
    if (visitedFolders.has(realFolderPath)) {
        return;
    }
    visitedFolders.add(realFolderPath);

    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        const lowerEntryName = entry.name.toLowerCase();
        if (SKIP_SCAN_FOLDER_NAMES.has(lowerEntryName) || SCAN_EXCLUDED_FILE_NAMES.has(lowerEntryName)) {
            continue;
        }

        let fullPathStat: fs.Stats;
        try {
            fullPathStat = fs.statSync(fullPath);
        } catch {
            continue;
        }

        if (fullPathStat.isDirectory()) {
            collectXmlCandidates(serverFolderPath, modFolderName, fullPath, candidates, visitedFolders, confirmationMap, ignoredMap, processedMap);
            continue;
        }

        if (!fullPathStat.isFile()) {
            continue;
        }

        const lowerFileName = entry.name.toLowerCase();
        const isXmlFile = lowerFileName.endsWith('.xml');
        const relativePath = path.relative(path.join(serverFolderPath, modFolderName), fullPath);
        const confirmedCopy = confirmationMap.get(relativePath);
        const ignoredCandidate = ignoredMap.get(relativePath);
        const processedCandidate = processedMap.get(relativePath);
        const typeByFileName = detectCeTypeByFileName(entry.name);
        const rootDetection = canReadFileHead(fullPath) ? detectCeTypeByXmlRoot(fullPath) : {};
        const detectedType = typeByFileName || rootDetection.directType || rootDetection.matchedType;
        const isCfgEconomyCore = lowerFileName === 'cfgeconomycore.xml';

        let confidence: 'high' | 'medium' | 'low' | 'ignored' = 'low';
        let enabled = false;
        let warning: string | undefined;
        let reason = 'No CE root tag found';

        if (isCfgEconomyCore) {
            confidence = 'ignored';
            reason = 'cfgeconomycore.xml is a CE index file, not a mount target';
            warning = reason;
        } else if (typeByFileName && rootDetection.directType === typeByFileName && (CE_CONFIG_TYPES as readonly string[]).includes(typeByFileName)) {
            confidence = 'high';
            enabled = true;
            reason = `File name and XML root match ${typeByFileName}`;
        } else if (typeByFileName && rootDetection.directType === typeByFileName) {
            confidence = 'medium';
            enabled = false;
            reason = `${typeByFileName} is not supported by official cfgeconomycore.xml mounting`;
            warning = 'Manual copy or merge required';
        } else if (isXmlFile || rootDetection.matchedType) {
            confidence = 'medium';
            reason = rootDetection.matchedType
                ? `CE tag looks like ${rootDetection.matchedType}, but file name/root is not an exact match`
                : 'XML file name is not an official CE file name';
            warning = 'Needs user review';
        }

        if (confirmedCopy) {
            confidence = 'high';
            enabled = true;
            warning = undefined;
            reason = `Manually confirmed and copied to ${CREATED_CONFIG_FOLDER_NAME}/${confirmedCopy.ceType}/${confirmedCopy.fileName}`;
        }

        if (ignoredCandidate) {
            confidence = 'ignored';
            enabled = false;
            warning = ignoredCandidate.reason || 'Ignored by user';
            reason = ignoredCandidate.reason || 'Ignored by user';
        }

        const processStatus = ignoredCandidate
            ? 'ignored'
            : processedCandidate
                ? 'processed'
                : (confidence === 'high' && getXmlConfigMountKind(confirmedCopy?.ceType || detectedType) === 'economycore')
                    ? 'waiting_to_mount'
                : 'unprocessed';

        candidates.push({
            modFolderName,
            sourcePath: fullPath,
            relativePath,
            fileName: confirmedCopy?.fileName || entry.name,
            detectedType: confirmedCopy?.ceType || detectedType,
            selectedType: confirmedCopy?.ceType || detectedType,
            confidence,
            enabled,
            isConfirmed: Boolean(confirmedCopy),
            confirmedType: confirmedCopy?.ceType,
            createdCopyPath: confirmedCopy?.createdCopyPath,
            mountSourcePath: confirmedCopy?.createdCopyPath || fullPath,
            mountKind: getXmlConfigMountKind(confirmedCopy?.ceType || detectedType),
            processStatus,
            isUserProcessed: Boolean(processedCandidate),
            warning,
            reason
        });
    }
}

const scanModCeConfigFiles = (serverFolderPath: string, modFolderNames: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const candidates: any[] = [];
            for (const modFolderName of modFolderNames) {
                const modFolderPath = path.join(serverFolderPath, modFolderName);
                if (fs.existsSync(modFolderPath)) {
                    collectXmlCandidates(
                        serverFolderPath,
                        modFolderName,
                        modFolderPath,
                        candidates,
                        new Set<string>(),
                        buildCeManualConfirmationMap(serverFolderPath, modFolderName),
                        buildCeIgnoredCandidateMap(serverFolderPath, modFolderName),
                        buildCeProcessedCandidateMap(serverFolderPath, modFolderName)
                    );
                }
            }

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = candidates;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const discoverMapMissionCandidates = (serverFolderPath: string, modFolderNames: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const candidates: MapMissionCandidate[] = [];
            for (const modFolderName of modFolderNames) {
                const modFolderPath = path.join(serverFolderPath, modFolderName);
                const searchFolders = [
                    path.join(modFolderPath, CREATED_CONFIG_FOLDER_NAME, 'map_missions'),
                    path.join(modFolderPath, 'map_missions'),
                    path.join(modFolderPath, 'mpmissions')
                ];

                for (const searchFolder of searchFolders) {
                    candidates.push(...collectMapMissionCandidatesFromFolder(modFolderName, searchFolder));
                }
            }

            for (const missionImport of readMissionImports(serverFolderPath)) {
                if (!modFolderNames.includes(missionImport.modFolderName) || !isValidMissionFolder(missionImport.importedPath)) {
                    continue;
                }

                candidates.push({
                    modFolderName: missionImport.modFolderName,
                    missionFolderName: missionImport.missionFolderName,
                    sourcePath: missionImport.importedPath,
                    isImported: true,
                    importedAt: missionImport.importedAt
                });
            }

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = candidates;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const detectTerrainResourceMods = (serverFolderPath: string, modFolderNames: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = modFolderNames
                .map((modFolderName) => detectTerrainResourceMod(serverFolderPath, modFolderName))
                .filter((detection) => detection.isTerrainResourceMod);
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const importMissionTemplate = (serverFolderPath: string, modFolderName: string, sourcePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const missionFolderName = path.basename(sourcePath);
            if (!missionFolderName.includes('.') || !isValidMissionFolder(sourcePath)) {
                throw new Error(`Invalid mission folder: ${sourcePath}`);
            }

            const importedPath = path.join(serverFolderPath, 'mpmissions', missionFolderName);
            fs.mkdirSync(path.dirname(importedPath), { recursive: true });
            fs.cpSync(sourcePath, importedPath, { recursive: true });

            const records = readMissionImports(serverFolderPath)
                .filter((record) => !(record.modFolderName === modFolderName && record.missionFolderName === missionFolderName));
            const record: MissionImportRecord = {
                modFolderName,
                missionFolderName,
                sourcePath,
                importedPath,
                importedAt: new Date().toISOString()
            };
            records.push(record);
            writeMissionImports(serverFolderPath, records);

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = record;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const validateMissionFolder = (missionPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const missionFolderName = path.basename(missionPath);
            if (!missionFolderName.includes('.') || !isValidMissionFolder(missionPath)) {
                throw new Error(`Invalid mission folder: ${missionPath}`);
            }

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = missionFolderName;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const getMissionDecisionState = (serverFolderPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = readMissionDecisionState(serverFolderPath);
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const saveSelectedMissionCandidate = (
    serverFolderPath: string,
    mission: { modFolderName: string; missionFolderName: string; sourcePath?: string; isImported?: boolean }
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const state = readMissionDecisionState(serverFolderPath);
            const nextState = writeMissionDecisionState(serverFolderPath, {
                ...state,
                selectedMission: {
                    modFolderName: mission.modFolderName,
                    missionFolderName: mission.missionFolderName,
                    sourcePath: mission.sourcePath,
                    isImported: mission.isImported,
                    updatedAt: new Date().toISOString()
                },
                ignoredTerrainModNames: state.ignoredTerrainModNames.filter((name) => name !== mission.modFolderName),
                processedTerrainModNames: state.processedTerrainModNames.filter((name) => name !== mission.modFolderName)
            });
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = nextState;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const clearSelectedMissionCandidate = (serverFolderPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const state = readMissionDecisionState(serverFolderPath);
            delete state.selectedMission;
            const nextState = writeMissionDecisionState(serverFolderPath, state);
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = nextState;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

function updateTerrainModDecision(serverFolderPath: string, modFolderName: string, action: 'ignore' | 'unignore' | 'process' | 'unprocess'): MissionDecisionState {
    const state = readMissionDecisionState(serverFolderPath);
    const ignored = new Set(state.ignoredTerrainModNames);
    const processed = new Set(state.processedTerrainModNames);

    if (action === 'ignore') {
        ignored.add(modFolderName);
        processed.delete(modFolderName);
        if (state.selectedMission?.modFolderName === modFolderName) {
            delete state.selectedMission;
        }
    } else if (action === 'unignore') {
        ignored.delete(modFolderName);
    } else if (action === 'process') {
        processed.add(modFolderName);
        ignored.delete(modFolderName);
        if (state.selectedMission?.modFolderName === modFolderName) {
            delete state.selectedMission;
        }
    } else if (action === 'unprocess') {
        processed.delete(modFolderName);
    }

    return writeMissionDecisionState(serverFolderPath, {
        ...state,
        ignoredTerrainModNames: Array.from(ignored),
        processedTerrainModNames: Array.from(processed)
    });
}

const saveIgnoredTerrainMod = (serverFolderPath: string, modFolderName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = { statusCode: null, data: null };
        try {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = updateTerrainModDecision(serverFolderPath, modFolderName, 'ignore');
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const removeIgnoredTerrainMod = (serverFolderPath: string, modFolderName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = { statusCode: null, data: null };
        try {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = updateTerrainModDecision(serverFolderPath, modFolderName, 'unignore');
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const saveProcessedTerrainMod = (serverFolderPath: string, modFolderName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = { statusCode: null, data: null };
        try {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = updateTerrainModDecision(serverFolderPath, modFolderName, 'process');
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const removeProcessedTerrainMod = (serverFolderPath: string, modFolderName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = { statusCode: null, data: null };
        try {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = updateTerrainModDecision(serverFolderPath, modFolderName, 'unprocess');
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const prepareServerConfigWorkspace = (
    serverFolderPath: string,
    sourcePresetPath: string,
    forceReplace = false,
    previousSourcePresetPath?: string | null
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            if (!serverFolderPath) {
                throw new Error('serverFolderPath is empty');
            }
            if (!sourcePresetPath || !fs.existsSync(sourcePresetPath)) {
                throw new Error(`source preset does not exist: ${sourcePresetPath}`);
            }

            const presetWorkspaceFolderPath = getPresetWorkspaceFolderPath(serverFolderPath);
            const activePresetPath = getActivePresetPath(serverFolderPath);
            const sourceInfo = readPresetSourceInfo(serverFolderPath);
            const activePresetExists = fs.existsSync(activePresetPath);
            const effectivePreviousSourcePresetPath = sourceInfo?.sourcePresetFilePath || previousSourcePresetPath;
            const sourceChanged = Boolean(activePresetExists && effectivePreviousSourcePresetPath && effectivePreviousSourcePresetPath !== sourcePresetPath);

            if (activePresetExists && sourceChanged && !forceReplace) {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = {
                    requiresConfirmation: true,
                    sourceChanged: true,
                    previousSourcePresetFilePath: effectivePreviousSourcePresetPath,
                    nextSourcePresetFilePath: sourcePresetPath,
                    activePresetPath
                };
                resolve(JSON.stringify(resData));
                return;
            }

            fs.mkdirSync(presetWorkspaceFolderPath, { recursive: true });
            let action: 'created' | 'reused' | 'replaced' = 'reused';
            if (!activePresetExists) {
                fs.copyFileSync(sourcePresetPath, activePresetPath);
                action = 'created';
            } else if (forceReplace) {
                fs.copyFileSync(sourcePresetPath, activePresetPath);
                action = 'replaced';
            }

            const nextSourceInfo = writePresetSourceInfo(serverFolderPath, sourcePresetPath, activePresetPath);
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                requiresConfirmation: false,
                sourceChanged,
                action,
                activePresetPath,
                sourceInfo: nextSourceInfo
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const createGeneratedServerConfigWorkspace = (serverFolderPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            if (!serverFolderPath) {
                throw new Error('serverFolderPath is empty');
            }

            const presetWorkspaceFolderPath = getPresetWorkspaceFolderPath(serverFolderPath);
            const activePresetPath = getActivePresetPath(serverFolderPath);
            fs.mkdirSync(presetWorkspaceFolderPath, { recursive: true });

            let action: 'created' | 'reused' = 'reused';
            if (!fs.existsSync(activePresetPath)) {
                fs.writeFileSync(activePresetPath, buildPresetXml(), 'utf-8');
                action = 'created';
            }

            const nextSourceInfo = writePresetSourceInfo(serverFolderPath, GENERATED_PRESET_SOURCE_NAME, activePresetPath);
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                requiresConfirmation: false,
                sourceChanged: false,
                action,
                activePresetPath,
                sourceInfo: nextSourceInfo
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const removeModsFromServerWorkspace = (serverFolderPath: string, modFolderNames: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            if (!serverFolderPath) {
                throw new Error('serverFolderPath is empty');
            }

            const removedModFolderNames = Array.from(new Set((modFolderNames || []).filter(Boolean)));
            for (const modFolderName of removedModFolderNames) {
                removeDirectoryInside(serverFolderPath, path.join(serverFolderPath, modFolderName));
            }
            cleanupMissionReferencesForRemovedMods(serverFolderPath, removedModFolderNames);
            cleanupRemovedModState(serverFolderPath, removedModFolderNames);

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                removedModFolderNames
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const markServerConfigWorkspacePresetSource = (serverFolderPath: string, sourcePresetPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            if (!serverFolderPath) {
                throw new Error('serverFolderPath is empty');
            }
            if (!sourcePresetPath || !fs.existsSync(sourcePresetPath)) {
                throw new Error(`source preset does not exist: ${sourcePresetPath}`);
            }

            const activePresetPath = getActivePresetPath(serverFolderPath);
            if (!fs.existsSync(activePresetPath)) {
                throw new Error(`active preset does not exist: ${activePresetPath}`);
            }

            const sourceInfo = writePresetSourceInfo(serverFolderPath, sourcePresetPath, activePresetPath);
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                activePresetPath,
                sourceInfo
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const saveManualCeConfigCopy = (
    serverFolderPath: string,
    modFolderName: string,
    sourcePath: string,
    ceType: CeConfigType,
    content: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            if (!(CE_CONFIG_TYPES as readonly string[]).includes(ceType)) {
                throw new Error(`Unsupported automatic mount type: ${ceType}`);
            }

            const rootDetection = detectCeTypeByXmlContent(content);
            if (rootDetection.directType !== ceType) {
                throw new Error(`XML root must be <${ceType}> to save into ${ceType}`);
            }

            const sourceRelativePath = getSourceRelativePath(serverFolderPath, modFolderName, sourcePath);

            const fileName = normalizeCeCopyFileName(sourcePath);
            const targetFolderPath = path.join(getCreatedConfigRootPath(serverFolderPath, modFolderName), ceType);
            const targetPath = path.join(targetFolderPath, fileName);
            fs.mkdirSync(targetFolderPath, { recursive: true });
            fs.writeFileSync(targetPath, content, 'utf-8');

            const confirmations = readCeManualConfirmations(serverFolderPath, modFolderName)
                .filter((item) => item.sourceRelativePath !== sourceRelativePath);
            confirmations.push({
                sourceRelativePath,
                sourcePath,
                ceType,
                fileName,
                createdCopyPath: targetPath,
                updatedAt: new Date().toISOString()
            });
            writeCeManualConfirmations(serverFolderPath, modFolderName, confirmations);
            writeCeIgnoredCandidates(
                serverFolderPath,
                modFolderName,
                readCeIgnoredCandidates(serverFolderPath, modFolderName)
                    .filter((item) => item.sourceRelativePath !== sourceRelativePath)
            );

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                sourceRelativePath,
                ceType,
                fileName,
                createdCopyPath: targetPath,
                mountKind: getXmlConfigMountKind(ceType)
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const revertManualCeConfigCopy = (
    serverFolderPath: string,
    modFolderName: string,
    sourcePath: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const sourceRelativePath = getSourceRelativePath(serverFolderPath, modFolderName, sourcePath);
            const confirmations = readCeManualConfirmations(serverFolderPath, modFolderName);
            const confirmation = confirmations.find((item) => item.sourceRelativePath === sourceRelativePath);
            const createdRootPath = getCreatedConfigRootPath(serverFolderPath, modFolderName);

            if (confirmation?.createdCopyPath) {
                const relativeCreatedCopyPath = path.relative(createdRootPath, confirmation.createdCopyPath);
                if (!relativeCreatedCopyPath.startsWith('..') && !path.isAbsolute(relativeCreatedCopyPath) && fs.existsSync(confirmation.createdCopyPath)) {
                    fs.unlinkSync(confirmation.createdCopyPath);

                    const parentFolder = path.dirname(confirmation.createdCopyPath);
                    if (parentFolder.startsWith(createdRootPath) && parentFolder !== createdRootPath) {
                        try {
                            fs.rmdirSync(parentFolder);
                        } catch {
                            // Non-empty folders are expected when other confirmed files exist.
                        }
                    }
                }
            }

            writeCeManualConfirmations(
                serverFolderPath,
                modFolderName,
                confirmations.filter((item) => item.sourceRelativePath !== sourceRelativePath)
            );

            const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                sourcePath,
                sourceRelativePath,
                content: sourceContent
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const saveIgnoredCeConfigCandidate = (
    serverFolderPath: string,
    modFolderName: string,
    sourcePath: string,
    reason = 'Ignored by user'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const sourceRelativePath = getSourceRelativePath(serverFolderPath, modFolderName, sourcePath);
            const ignoredCandidates = readCeIgnoredCandidates(serverFolderPath, modFolderName)
                .filter((item) => item.sourceRelativePath !== sourceRelativePath);
            ignoredCandidates.push({
                sourceRelativePath,
                sourcePath,
                reason,
                updatedAt: new Date().toISOString()
            });
            writeCeIgnoredCandidates(serverFolderPath, modFolderName, ignoredCandidates);

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                sourceRelativePath,
                sourcePath,
                reason
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const removeIgnoredCeConfigCandidate = (
    serverFolderPath: string,
    modFolderName: string,
    sourcePath: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const sourceRelativePath = getSourceRelativePath(serverFolderPath, modFolderName, sourcePath);
            const ignoredCandidates = readCeIgnoredCandidates(serverFolderPath, modFolderName)
                .filter((item) => item.sourceRelativePath !== sourceRelativePath);
            writeCeIgnoredCandidates(serverFolderPath, modFolderName, ignoredCandidates);

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                sourceRelativePath,
                sourcePath
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const saveProcessedCeConfigCandidate = (
    serverFolderPath: string,
    modFolderName: string,
    sourcePath: string,
    reason = 'Processed by user'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const sourceRelativePath = getSourceRelativePath(serverFolderPath, modFolderName, sourcePath);
            const processedCandidates = readCeProcessedCandidates(serverFolderPath, modFolderName)
                .filter((item) => item.sourceRelativePath !== sourceRelativePath);
            processedCandidates.push({
                sourceRelativePath,
                sourcePath,
                reason,
                updatedAt: new Date().toISOString()
            });
            writeCeProcessedCandidates(serverFolderPath, modFolderName, processedCandidates);
            writeCeIgnoredCandidates(
                serverFolderPath,
                modFolderName,
                readCeIgnoredCandidates(serverFolderPath, modFolderName)
                    .filter((item) => item.sourceRelativePath !== sourceRelativePath)
            );

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                sourceRelativePath,
                sourcePath,
                reason
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const removeProcessedCeConfigCandidate = (
    serverFolderPath: string,
    modFolderName: string,
    sourcePath: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const sourceRelativePath = getSourceRelativePath(serverFolderPath, modFolderName, sourcePath);
            const processedCandidates = readCeProcessedCandidates(serverFolderPath, modFolderName)
                .filter((item) => item.sourceRelativePath !== sourceRelativePath);
            writeCeProcessedCandidates(serverFolderPath, modFolderName, processedCandidates);

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = {
                sourceRelativePath,
                sourcePath
            };
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const discoverToolCreatedConfigFolders = (serverFolderPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        };

        try {
            const discovered: Array<{ createdRootPath: string; configFolderPaths: string[] }> = [];
            const serverEntries = fs.readdirSync(serverFolderPath, { withFileTypes: true });

            for (const entry of serverEntries) {
                if (!entry.isDirectory()) {
                    continue;
                }

                const createdRootPath = path.join(serverFolderPath, entry.name, CREATED_CONFIG_FOLDER_NAME);
                if (!fs.existsSync(createdRootPath)) {
                    continue;
                }

                const configFolderPaths = fs.readdirSync(createdRootPath, { withFileTypes: true })
                    .filter((configEntry) => configEntry.isDirectory())
                    .map((configEntry) => path.join(createdRootPath, configEntry.name));

                discovered.push({
                    createdRootPath,
                    configFolderPaths
                });
            }

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = discovered;
            resolve(JSON.stringify(resData));
        } catch (error: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = error.message;
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

/**
 * 读取文件内容
 */
const getPictureContent = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }

        fs.readFile(path, (err: any, data: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                resData.data = `data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`;
                resolve(JSON.stringify(resData));
            }
        });
    })
}

/**
 * 读取文件内容
 */
const getPictureContentSync = (path: string): string => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
    const data: any = fs.readFileSync(path);
    resData.statusCode = STATUS_CODE.SUCCESS;
    resData.data = `data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`;
    return JSON.stringify(resData);
}

/**
 * 校验文件夹路径是否正确
 */
const pathValidate = (path: string): Promise<string> => {
    return getDirectoryPath(path);
}

/**
 * 验证路径是否为空
 */
const pathCleanValidate = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }
        fs.readdir(path, {encoding: 'utf-8'}, (err: any, files: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                resData.statusCode = STATUS_CODE.SUCCESS;
                if(files.length > 0) {
                    resData.data = false;
                } else {
                    resData.data = true;
                }
                resolve(JSON.stringify(resData));
            }
        });
    })
}

const getStartUpFileContent = (): Promise<string>  => {
    let START_UP_FILE_PATH = path.join(process.cwd(), 'public', 'resource', 'startup.bat');
     // 判断是否是正式环境
     if (app.isPackaged) {
        if(process.platform === 'darwin') {
            // 正式环境
            START_UP_FILE_PATH =  path.join(app.getAppPath(), '..', './resource/startup.bat');
        } else {
            // 正式环境
            // 获取用户本地应用数据目录 (C:\Users\用户名\AppData\Local\软件名)
            const userDataPath = app.getPath('userData');

            // 设置数据库路径为：C:\Users\用户名\AppData\Local\软件名\startup.bat
            START_UP_FILE_PATH = path.join(userDataPath, 'startup.bat');    
            if (!fs.existsSync(START_UP_FILE_PATH)) {
                // 如果不存在，复制文件到
                const startupFilePath = path.join(process.resourcesPath, 'startup.bat');
                fs.copyFileSync(startupFilePath, START_UP_FILE_PATH);
            }
        }
    }
    return new Promise((resolve) => {
        getFileContent(START_UP_FILE_PATH).then((fileContentResData: string) => {
            resolve(fileContentResData);
        })
    });
}

const overwriteStartupFileContent = (content: string, targetFilePath: string) : Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
    let START_UP_FILE_PATH = path.join(process.cwd(), 'public', 'resource', 'startup.bat');
    // 判断是否是正式环境
    if (app.isPackaged) {
       if(process.platform === 'darwin') {
           // 正式环境
           START_UP_FILE_PATH =  path.join(app.getAppPath(), '..', './resource/startup.bat');
       } else {
           // 正式环境
           START_UP_FILE_PATH =  path.join(path.dirname(app.getPath('exe')), './resources/startup.bat');
       }
   }
   return new Promise((resolve, reject) => {
    
    // 将字符串写入文件
    fs.writeFile(targetFilePath, content, (err) => {
        if (err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
           reject(jsonStringfyToIPCMAINError(resData));
        } else {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(JSON.stringify(resData));
        }
    });
   });
}

const overwriteFileContent = (content: string, targetFilePath: string) : Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
   return new Promise((resolve, reject) => {
    
    // 将字符串写入文件
    fs.writeFile(targetFilePath, content, (err) => {
        if (err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.message;
           reject(jsonStringfyToIPCMAINError(resData));
        } else {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(JSON.stringify(resData));
        }
    });
   });
}

const createServerProfileFolder = (serverProfileFolderPath: string) : Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
   return new Promise((resolve, reject) => {

    fs.mkdir(serverProfileFolderPath, {recursive: true}, (err) => {
        if(err) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.toString();
           reject(jsonStringfyToIPCMAINError(resData));
        } else {
            resData.statusCode = STATUS_CODE.SUCCESS;
            resolve(JSON.stringify(resData));
        }
    })
   });
}

const createModConfigFolders = (targetPath: string, folders: string[], isMapMod: boolean) => {
    const resData: ResData = {
        statusCode: null,
        data: null
    }
   return new Promise((resolve, reject) => {
    for(let folder of folders) {
        try {
            if((folder === 'map_missions' && isMapMod) || folder !== 'map_missions') {
                const willBeCreatePath = `${targetPath}${path.sep}${folder}`;
                fs.mkdirSync(willBeCreatePath, {recursive: true});
            }
        } catch (err: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.toString();
           reject(jsonStringfyToIPCMAINError(resData));
        }
    }
    resData.statusCode = STATUS_CODE.SUCCESS;
    resolve(JSON.stringify(resData));
   });
}

const createModFolderLinks = (sourceModPath: string, targetModPath: string): Promise<string> => {
    const resData: ResData = {
        statusCode: null,
        data: null
    };

    return new Promise((resolve, reject) => {
        try {
            fs.mkdirSync(targetModPath, { recursive: true });
            const entries = fs.readdirSync(sourceModPath, { withFileTypes: true });
            for (const entry of entries) {
                if (MOD_LINK_EXCLUDED_NAMES.has(entry.name.toLowerCase())) {
                    continue;
                }

                const sourcePath = path.join(sourceModPath, entry.name);
                const targetPath = path.join(targetModPath, entry.name);
                if (fs.existsSync(targetPath)) {
                    continue;
                }

                const lowerEntryName = entry.name.toLowerCase();
                if (entry.isDirectory() && MOD_LINKED_FOLDER_NAMES.has(lowerEntryName)) {
                    fs.symlinkSync(sourcePath, targetPath, 'junction');
                } else if (entry.isFile() && MOD_LINKED_FILE_NAMES.has(lowerEntryName)) {
                    try {
                        fs.symlinkSync(sourcePath, targetPath, 'file');
                    } catch {
                        fs.copyFileSync(sourcePath, targetPath);
                    }
                } else if (entry.isDirectory()) {
                    fs.cpSync(sourcePath, targetPath, { recursive: true });
                } else {
                    fs.copyFileSync(sourcePath, targetPath);
                }
            }

            resData.statusCode = STATUS_CODE.SUCCESS;
            resData.data = targetModPath;
            resolve(JSON.stringify(resData));
        } catch (err: any) {
            resData.statusCode = STATUS_CODE.API_ERROR;
            resData.data = err.toString();
            reject(jsonStringfyToIPCMAINError(resData));
        }
    });
}

const pathMissionsFolderValidate = (path: string) => {
    return new Promise((resolve, reject) => {
        const resData: ResData = {
            statusCode: null,
            data: null
        }
        fs.readdir(path, {encoding: 'utf-8'}, (err: any, files: any) => {
            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                if(files.length !== 1) {
                    resData.data = null;
                } else {
                    if(files[0].indexOf('.') === -1) {
                        resData.statusCode = STATUS_CODE.API_ERROR;
                        resData.data = 'the mpmissions folder is not correctly! (do not have .)';
                        reject(jsonStringfyToIPCMAINError(resData));
                    } else {
                        let names = fs.readdirSync(path + PATH_SEP + files[0]);
                        let condition = 0;
                        for(let name of names) {
                            if(name === 'init.c') {
                                condition ++;
                            }
                            if(name === 'db') {
                                condition ++;
                            }
                        }
                        if(condition === 2) {
                            resData.statusCode = STATUS_CODE.SUCCESS;
                            resData.data = files[0];
                            resolve(JSON.stringify(resData));
                        } else {
                            resData.statusCode = STATUS_CODE.API_ERROR;
                            resData.data = `the mpmissions folder is not correctly! (do not have 'init.c' or 'db')`;
                           reject(jsonStringfyToIPCMAINError(resData));
                        }        
                    }   
                }
            }



            if (err) {
                resData.statusCode = STATUS_CODE.API_ERROR;
                resData.data = err.message;
               reject(jsonStringfyToIPCMAINError(resData));
            } else {
                let conditions = 0
                
                if(conditions >= 2 && files.includes('init.c')) {
                    resData.statusCode = STATUS_CODE.SUCCESS;
                    if(files.length > 0) {
                        resData.data = false;
                    } else {
                        resData.data = true;
                    }
                }
                resolve(JSON.stringify(resData));
            }
        });
    })
}

/**
 * get previewImage from net
 */
// const getModPreviewImage = (url: string): Promise<string> => {
//     const resData: ResData = {
//         statusCode: null,
//         data: null
//     }
//     return new Promise<string>(async (resolve, reject) => {
//         try {
//             // 启动浏览器
//             const browser = await puppeteer.launch({
//                 headless: true, // 设置为true以无头模式运行，false则可以看到浏览器窗口
//                 args: ['--no-sandbox', '--disable-setuid-sandbox'],
//                 defaultViewport: { width: 2560, height: 1440 } // 设置默认视口大小
//             });

//             // 创建新页面
//             const page = await browser.newPage();

//             // 导航到目标页面
//             await page.goto(url, { waitUntil: 'networkidle2' }); // 等待页面加载完成

//             // 抓取页面内容
//             let content = await page.content();
//             content = content.substring(content.indexOf(`<img id="previewImageMain" class="workshopItemPreviewImageMain" src="`), content.lastIndexOf(`<span class="zoom-icon">`));
//             let previewImageUrl =content.substring(content.indexOf("src=\"") + 5, content.lastIndexOf("\""));
//             // 关闭浏览器
//             await browser.close();
//             resData.statusCode = STATUS_CODE.SUCCESS;
//             resData.data = previewImageUrl;
//             resolve(JSON.stringify(resData));
//         } catch (err: any) {
//             resData.statusCode = STATUS_CODE.API_ERROR;
//             resData.data = err.toString();
//             reject(JSON.stringify(resData));
//         }
//     })
// }


// 需要在IPC RENDER 使用 invoke调用的方法
const osServiceHanleMethodMap: Map<string, Function> = new Map();
osServiceHanleMethodMap.set("getPathSep", getPathSep);
osServiceHanleMethodMap.set("getOsUserName", getOsUserName);
osServiceHanleMethodMap.set("getDirectoryPath", getDirectoryPath);
osServiceHanleMethodMap.set("getFileNameList", getFileNameList);
osServiceHanleMethodMap.set("getFileContent", getFileContent);
osServiceHanleMethodMap.set("getPictureContent", getPictureContent);
osServiceHanleMethodMap.set("getPictureContentSync", getPictureContentSync);
osServiceHanleMethodMap.set("pathValidate", pathValidate);
osServiceHanleMethodMap.set("pathCleanValidate", pathCleanValidate);
osServiceHanleMethodMap.set("getStartUpFileContent", getStartUpFileContent);
osServiceHanleMethodMap.set("overwriteFileContent", overwriteFileContent);
osServiceHanleMethodMap.set("overwriteStartupFileContent", overwriteStartupFileContent);
osServiceHanleMethodMap.set("createServerProfileFolder", createServerProfileFolder);
osServiceHanleMethodMap.set("createModConfigFolders", createModConfigFolders);
osServiceHanleMethodMap.set("createModFolderLinks", createModFolderLinks);
osServiceHanleMethodMap.set("pathMissionsFolderValidate", pathMissionsFolderValidate);
osServiceHanleMethodMap.set("scanModCeConfigFiles", scanModCeConfigFiles);
osServiceHanleMethodMap.set("discoverMapMissionCandidates", discoverMapMissionCandidates);
osServiceHanleMethodMap.set("detectTerrainResourceMods", detectTerrainResourceMods);
osServiceHanleMethodMap.set("validateMissionFolder", validateMissionFolder);
osServiceHanleMethodMap.set("prepareServerConfigWorkspace", prepareServerConfigWorkspace);
osServiceHanleMethodMap.set("createGeneratedServerConfigWorkspace", createGeneratedServerConfigWorkspace);
osServiceHanleMethodMap.set("removeModsFromServerWorkspace", removeModsFromServerWorkspace);
osServiceHanleMethodMap.set("markServerConfigWorkspacePresetSource", markServerConfigWorkspacePresetSource);
osServiceHanleMethodMap.set("importMissionTemplate", importMissionTemplate);
osServiceHanleMethodMap.set("getMissionDecisionState", getMissionDecisionState);
osServiceHanleMethodMap.set("saveSelectedMissionCandidate", saveSelectedMissionCandidate);
osServiceHanleMethodMap.set("clearSelectedMissionCandidate", clearSelectedMissionCandidate);
osServiceHanleMethodMap.set("saveIgnoredTerrainMod", saveIgnoredTerrainMod);
osServiceHanleMethodMap.set("removeIgnoredTerrainMod", removeIgnoredTerrainMod);
osServiceHanleMethodMap.set("saveProcessedTerrainMod", saveProcessedTerrainMod);
osServiceHanleMethodMap.set("removeProcessedTerrainMod", removeProcessedTerrainMod);
osServiceHanleMethodMap.set("discoverToolCreatedConfigFolders", discoverToolCreatedConfigFolders);
osServiceHanleMethodMap.set("saveManualCeConfigCopy", saveManualCeConfigCopy);
osServiceHanleMethodMap.set("revertManualCeConfigCopy", revertManualCeConfigCopy);
osServiceHanleMethodMap.set("saveIgnoredCeConfigCandidate", saveIgnoredCeConfigCandidate);
osServiceHanleMethodMap.set("removeIgnoredCeConfigCandidate", removeIgnoredCeConfigCandidate);
osServiceHanleMethodMap.set("saveProcessedCeConfigCandidate", saveProcessedCeConfigCandidate);
osServiceHanleMethodMap.set("removeProcessedCeConfigCandidate", removeProcessedCeConfigCandidate);
// osServiceHanleMethodMap.set("getModPreviewImage", getModPreviewImage);


export {
    osServiceHanleMethodMap
}
