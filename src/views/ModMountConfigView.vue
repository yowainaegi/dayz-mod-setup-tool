<template>
    <div id="ModMountConfig" class="view-wrap">
        <div class="view-content">
            <section class="mount-panel">
                <div class="summary-row">
                    <span>{{ $t('ModMountConfigView.summary.total') }}: {{ candidates.length }}</span>
                    <span>{{ $t('ModMountConfigView.summary.enabled') }}: {{ enabledCount }}</span>
                    <span>{{ $t('ModMountConfigView.summary.needReview') }}: {{ reviewCount }}</span>
                    <label class="mission-select-row">
                        <span>{{ $t('ModMountConfigView.summary.mission') }}:</span>
                        <a-select
                            v-model:value="selectedMissionKey"
                            class="mission-select"
                            :placeholder="missionOptions.length > 1 ? $t('ModMountConfigView.summary.selectMission') : undefined"
                        >
                            <a-select-option
                                v-for="missionOption in missionOptions"
                                :key="missionOption.key"
                                :value="missionOption.key"
                            >
                                {{ missionOption.label }}
                            </a-select-option>
                        </a-select>
                    </label>
                </div>

                <div v-if="terrainMissionRows.length > 0" class="mission-panel">
                    <div class="table-header">
                        <h3>{{ $t('ModMountConfigView.mission.title') }}</h3>
                        <span v-if="hasMissionConflict" class="mission-warning">{{ $t('ModMountConfigView.mission.conflictWarning') }}</span>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ $t('ModMountConfigView.table.mod') }}</th>
                                    <th>{{ $t('ModMountConfigView.table.terrainResource') }}</th>
                                    <th>{{ $t('ModMountConfigView.table.mission') }}</th>
                                    <th>{{ $t('ModMountConfigView.table.status') }}</th>
                                    <th>{{ $t('ModMountConfigView.table.reason') }}</th>
                                    <th>{{ $t('ModMountConfigView.table.action') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="row in terrainMissionRows"
                                    :key="row.modFolderName"
                                    class="terrain-row"
                                    :class="{ 'context-active': terrainContextMenu.visible && terrainContextMenu.row?.modFolderName === row.modFolderName }"
                                    @contextmenu.prevent.stop="openTerrainContextMenu($event, row)"
                                >
                                    <td>{{ row.modFolderName }}</td>
                                    <td>
                                        <span :class="['terrain-confidence', row.confidence.toLowerCase()]">{{ getConfidenceLabel(row.confidence) }}</span>
                                    </td>
                                    <td>{{ row.missionLabel }}</td>
                                    <td>
                                        <span :class="['mission-status', row.status]">{{ row.statusLabel }}</span>
                                    </td>
                                    <td>{{ row.reason }}</td>
                                    <td>
                                        <div class="row-actions">
                                            <button
                                                v-if="!row.primaryMission"
                                                type="button"
                                                :disabled="row.status === 'ignored' || row.status === 'processed'"
                                                @click="importMissionTemplateForMod(row.modFolderName)"
                                            >
                                                {{ $t('ModMountConfigView.actions.import') }}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <transition name="candidate-context-menu-motion">
                            <div
                                v-if="terrainContextMenu.visible"
                                class="candidate-context-menu terrain-context-menu"
                                :style="{ left: `${terrainContextMenu.x}px`, top: `${terrainContextMenu.y}px` }"
                                @click.stop
                                @contextmenu.prevent
                            >
                                <button
                                    v-if="terrainContextMenu.row?.primaryMission && terrainContextMenu.row.status !== 'selected'"
                                    type="button"
                                    @click="useContextTerrainMission"
                                >
                                    {{ $t('ModMountConfigView.actions.useThisMission') }}
                                </button>
                                <button
                                    v-if="terrainContextMenu.row?.status === 'ignored'"
                                    type="button"
                                    @click="unignoreContextTerrain"
                                >
                                    {{ $t('ModMountConfigView.actions.unignore') }}
                                </button>
                                <button
                                    v-else
                                    type="button"
                                    @click="ignoreContextTerrain"
                                >
                                    {{ $t('ModMountConfigView.actions.ignore') }}
                                </button>
                                <button
                                    v-if="terrainContextMenu.row?.status === 'processed'"
                                    type="button"
                                    @click="unprocessContextTerrain"
                                >
                                    {{ $t('ModMountConfigView.actions.unprocess') }}
                                </button>
                                <button
                                    v-else-if="terrainContextMenu.row?.status !== 'selected' && terrainContextMenu.row?.status !== 'ignored'"
                                    type="button"
                                    @click="processContextTerrain"
                                >
                                    {{ $t('ModMountConfigView.actions.process') }}
                                </button>
                            </div>
                        </transition>
                    </div>
                </div>

                <div class="workbench">
                    <aside class="mod-list">
                        <h3>{{ $t('ModMountConfigView.table.mods') }}</h3>
                        <button
                            v-for="modFolderName in modFolderNames"
                            :key="modFolderName"
                            class="mod-list-item"
                            :class="{ active: selectedModFolderName === modFolderName }"
                            type="button"
                            @click="selectedModFolderName = modFolderName"
                        >
                            <span>{{ modFolderName }}</span>
                            <strong>{{ countByMod(modFolderName) }}</strong>
                        </button>
                    </aside>

                    <main class="candidate-list">
                        <div class="table-header">
                            <h3>{{ $t('ModMountConfigView.table.candidateXmlFiles') }}</h3>
                            <div class="table-actions">
                                <span v-if="selectedCandidates.length > 0" class="selected-count">{{ $t('ModMountConfigView.table.selected') }}: {{ selectedCandidates.length }}</span>
                                <a-button v-if="showBatchSetActions" size="small" @click="batchIgnoreCandidates">{{ $t('ModMountConfigView.actions.ignore') }}</a-button>
                                <a-button v-if="showBatchSetActions" size="small" @click="batchProcessCandidates">{{ $t('ModMountConfigView.actions.process') }}</a-button>
                                <a-button v-if="selectedAllIgnored" size="small" @click="batchUnignoreCandidates">{{ $t('ModMountConfigView.actions.unignore') }}</a-button>
                                <a-button v-if="selectedAllProcessed" size="small" @click="batchUnprocessCandidates">{{ $t('ModMountConfigView.actions.unprocess') }}</a-button>
                            </div>
                        </div>

                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            <a-checkbox
                                                :checked="allVisibleCandidatesSelected"
                                                :disabled="visibleCandidates.length === 0"
                                                :indeterminate="someVisibleCandidatesSelected && !allVisibleCandidatesSelected"
                                                @change="setVisibleCandidatesSelected($event.target.checked)"
                                            />
                                        </th>
                                        <th>{{ $t('ModMountConfigView.table.file') }}</th>
                                        <th>{{ $t('ModMountConfigView.table.ceType') }}</th>
                                        <th>{{ $t('ModMountConfigView.table.confidence') }}</th>
                                        <th>{{ $t('ModMountConfigView.table.status') }}</th>
                                        <th>{{ $t('ModMountConfigView.table.reason') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="candidate in visibleCandidates"
                                        :key="candidate.sourcePath"
                                        class="candidate-row"
                                        :class="{
                                            'context-active': candidateContextMenu.visible && candidateContextMenu.candidate?.sourcePath === candidate.sourcePath,
                                            'context-menu-open': candidateContextMenu.visible
                                        }"
                                        @contextmenu.prevent.stop="openCandidateContextMenu($event, candidate)"
                                    >
                                        <td>
                                            <a-checkbox
                                                :checked="isCandidateSelected(candidate)"
                                                @change="toggleCandidateSelection(candidate, $event.target.checked)"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                class="file-name-button"
                                                type="button"
                                                :title="candidate.sourcePath"
                                                @click.stop="openFilePreview(candidate)"
                                            >
                                                {{ candidate.fileName }}
                                            </button>
                                        </td>
                                        <td>
                                            <a-select
                                                v-model:value="candidate.selectedType"
                                                class="type-select"
                                                allow-clear
                                                :disabled="candidate.confidence !== 'high' || candidate.mountKind !== 'economycore'"
                                            >
                                                <a-select-option v-for="type in ceConfigTypes" :key="type" :value="type">
                                                    {{ type }}
                                                </a-select-option>
                                            </a-select>
                                        </td>
                                        <td>
                                            <span :class="['confidence', candidate.confidence]">{{ getConfidenceLabel(candidate.confidence) }}</span>
                                        </td>
                                        <td>
                                            <span :class="['process-status', getProcessStatus(candidate)]">{{ getProcessStatusLabel(candidate) }}</span>
                                        </td>
                                        <td>{{ getCandidateReasonLabel(candidate.reason) }}</td>
                                    </tr>
                                    <tr v-if="visibleCandidates.length === 0">
                                        <td colspan="6" class="empty-cell">{{ $t('ModMountConfigView.table.empty') }}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <transition name="candidate-context-menu-motion">
                                <div
                                    v-if="candidateContextMenu.visible"
                                    class="candidate-context-menu"
                                    :style="{ left: `${candidateContextMenu.x}px`, top: `${candidateContextMenu.y}px` }"
                                    @click.stop
                                    @contextmenu.prevent
                                >
                                    <button type="button" @click="previewContextCandidate">{{ $t('ModMountConfigView.actions.preview') }}</button>
                                    <button type="button" @click="editContextCandidate">{{ $t('ModMountConfigView.actions.edit') }}</button>
                                    <button
                                        v-if="candidateContextMenu.candidate?.processStatus === 'processed'"
                                        type="button"
                                        @click="unprocessContextCandidate"
                                    >
                                        {{ $t('ModMountConfigView.actions.unprocess') }}
                                    </button>
                                    <button
                                        v-else-if="candidateContextMenu.candidate && getProcessStatus(candidateContextMenu.candidate) !== 'ignored'"
                                        type="button"
                                        @click="processContextCandidate"
                                    >
                                        {{ $t('ModMountConfigView.actions.process') }}
                                    </button>
                                    <button
                                        v-if="candidateContextMenu.candidate?.confidence === 'ignored'"
                                        type="button"
                                        @click="unignoreContextCandidate"
                                    >
                                        {{ $t('ModMountConfigView.actions.unignore') }}
                                    </button>
                                    <button v-else type="button" @click="ignoreContextCandidate">{{ $t('ModMountConfigView.actions.ignore') }}</button>
                                </div>
                            </transition>
                        </div>
                    </main>

                </div>

                <div class="process-bar-area" v-if="isRunning">
                    <div>{{ processTitle }}</div>
                    <a-progress :percent="percent" :show-info="false" />
                    <div v-if="!isCounting && !isComplete">{{ processSrcPath }} -> {{ processTargetPath }}</div>
                    <div v-if="isCounting && !isComplete">{{ $t('ModMountConfigView.fileFound', { processFileCount }) }}</div>
                </div>
            </section>
        </div>
        <FixedFooterActions>
            <a-button @click="back" :disabled="isRunning">{{ $t('ModMountConfigView.back') }}</a-button>
            <a-button
                v-if="!isComplete"
                @click="next"
                type="primary"
                :disabled="!canRunMount"
                :loading="isRunning"
            >
                {{ primaryActionText }}
            </a-button>
            <a-button @click="completedNext" type="primary" v-if="isComplete">{{ $t('ModMountConfigView.done') }}</a-button>
        </FixedFooterActions>
    </div>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { i18n } from '@/i18n';
import { computed, onBeforeUnmount, ref, Ref } from 'vue';
import ServerConfigFile from '@/server/models/ServerConfigFile';
import ResData from '@/server/models/ResData';
import { globalErrorHandler } from '@/config/globalErrorHandler';
import useIpcListeners from '@/utils/useIpcListeners';
import { getPathSep } from '@/utils/OsUtils';
import { runModMountWorkflow } from '@/services/modSetup/modMountWorkflow';
import { CE_CONFIG_TYPES, CREATED_CONFIG_FOLDER_NAME } from '@/services/modSetup/constants';
import { CeConfigType, MapMissionCandidate, MissionDecisionState, MissionSelection, ModCeFileCandidate, ModCeMountItem, ModMountStageTitles, TerrainResourceDetection } from '@/services/modSetup/types';
import { confirmNativeDialog } from '@/utils/nativeDialog';
import { updateConfigStatus } from '@/server/api/ConfigFileEditApi';
import FixedFooterActions from '@/components/common/FixedFooterActions/index.vue';

const store = useStore();
const router = useRouter();

store.commit('updatePageTitle', i18n.global.t('ModMountConfigView.pageTitle'));

const serverConfigFile: ServerConfigFile = store.state.selectedConfigFile;
const toolCreatedFolderPathMap: Ref<Map<string, string[]>> = ref(store.state.toolCreatedFolderPathMap || new Map<string, string[]>());

const ceConfigTypes = CE_CONFIG_TYPES;
const createdConfigFolderName = CREATED_CONFIG_FOLDER_NAME;
const candidates: Ref<ModCeFileCandidate[]> = ref([]);
const selectedCandidatePaths: Ref<Set<string>> = ref(new Set<string>());
const selectedModFolderName: Ref<string> = ref('ALL');
const selectedMissionKey: Ref<string | undefined> = ref(undefined);
const missionOptions: Ref<Array<{ key: string; label: string; mission: MissionSelection; isDetectedMap: boolean; modFolderName?: string }>> = ref([]);
const missionCandidateModNames: Ref<Set<string>> = ref(new Set<string>());
const missionCandidates: Ref<MapMissionCandidate[]> = ref([]);
const missionDecisionState: Ref<MissionDecisionState> = ref({
    ignoredTerrainModNames: [],
    processedTerrainModNames: []
});
const terrainDetections: Ref<TerrainResourceDetection[]> = ref([]);
const isScanning: Ref<boolean> = ref(false);
const isRunning: Ref<boolean> = ref(false);
const percent: Ref<number> = ref(0);
const processFileCount: Ref<number> = ref(0);
const processSrcPath: Ref<string | null> = ref(null);
const processTargetPath: Ref<string | null> = ref(null);
const processTitle: Ref<string> = ref('');
const isCounting: Ref<boolean> = ref(true);
const isComplete: Ref<boolean> = ref(false);
const { receiveIpc, clearIpcListeners } = useIpcListeners();
const savedIpcListeners = useIpcListeners();
const candidateContextMenu: Ref<{
    visible: boolean;
    x: number;
    y: number;
    candidate: ModCeFileCandidate | null;
}> = ref({
    visible: false,
    x: 0,
    y: 0,
    candidate: null
});

const tm = (key: string, params?: Record<string, unknown>) => i18n.global.t(`ModMountConfigView.${key}`, params || {});
const getConfidenceLabel = (confidence: string) => tm(`confidence.${confidence.toLowerCase()}`);
const xmlReasonKeyMap: Record<string, string> = {
    'No CE root tag found': 'noCeRootTagFound',
    'XML file name is not an official CE file name': 'unofficialCeFileName',
    'cfgeconomycore.xml is a CE index file, not a mount target': 'cfgeconomycoreIndexFile',
    'Needs user review': 'needsUserReview',
    'Manual copy or merge required': 'manualCopyOrMergeRequired',
    'Ignored by user': 'ignoredByUser',
    'Processed by user': 'processedByUser',
};

type TerrainMissionStatus = 'selected' | 'ready' | 'conflict' | 'missing' | 'ignored' | 'processed' | 'unprocessed';

interface TerrainMissionRow {
    modFolderName: string;
    confidence: TerrainResourceDetection['confidence'];
    primaryMission?: MapMissionCandidate;
    missionLabel: string;
    status: TerrainMissionStatus;
    statusLabel: string;
    reason: string;
}

const terrainContextMenu: Ref<{
    visible: boolean;
    x: number;
    y: number;
    row: TerrainMissionRow | null;
}> = ref({
    visible: false,
    x: 0,
    y: 0,
    row: null
});

const stageTitles: ModMountStageTitles = {
    copyMissions: i18n.global.t('ModMountConfigView.stagesTitle.copy_missions_file_to_target_path'),
    copyModConfigXml: i18n.global.t('ModMountConfigView.stagesTitle.copy_mod_config_xml_to_target_path'),
    completed: i18n.global.t('ModMountConfigView.stagesTitle.completed')
};

const modFolderNames = computed(() => {
    const names = new Set<string>();
    for (const createdRootPath of toolCreatedFolderPathMap.value.keys()) {
        const modFolderName = resolveModFolderName(createdRootPath);
        if (modFolderName) {
            names.add(modFolderName);
        }
    }

    return ['ALL', ...Array.from(names)];
});

const visibleCandidates = computed(() => {
    if (selectedModFolderName.value === 'ALL') {
        return candidates.value;
    }

    return candidates.value.filter((candidate) => candidate.modFolderName === selectedModFolderName.value);
});

const selectedCandidates = computed(() => {
    return candidates.value.filter((candidate) => selectedCandidatePaths.value.has(candidate.sourcePath));
});
const selectedAllIgnored = computed(() => {
    return selectedCandidates.value.length > 0
        && selectedCandidates.value.every((candidate) => getProcessStatus(candidate) === 'ignored');
});
const selectedAllProcessed = computed(() => {
    return selectedCandidates.value.length > 0
        && selectedCandidates.value.every((candidate) => candidate.processStatus === 'processed');
});
const showBatchSetActions = computed(() => {
    return selectedCandidates.value.length > 0
        && !selectedAllIgnored.value
        && !selectedAllProcessed.value;
});

const allVisibleCandidatesSelected = computed(() => {
    return visibleCandidates.value.length > 0
        && visibleCandidates.value.every((candidate) => selectedCandidatePaths.value.has(candidate.sourcePath));
});
const someVisibleCandidatesSelected = computed(() => {
    return visibleCandidates.value.some((candidate) => selectedCandidatePaths.value.has(candidate.sourcePath));
});

const mountItems = computed<ModCeMountItem[]>(() => {
    return candidates.value
        .filter((candidate) => {
            return candidate.processStatus === 'waiting_to_mount'
                && candidate.enabled
                && candidate.selectedType
                && candidate.mountKind === 'economycore';
        })
        .map((candidate) => ({
            modFolderName: candidate.modFolderName,
            sourcePath: candidate.mountSourcePath || candidate.createdCopyPath || candidate.sourcePath,
            fileName: candidate.fileName,
            selectedType: candidate.selectedType as CeConfigType,
            mountKind: 'economycore'
        }));
});

const enabledCount = computed(() => mountItems.value.length);
const reviewCount = computed(() => candidates.value.filter((candidate) => candidate.confidence !== 'high').length);
const allCandidatesHandled = computed(() => {
    return candidates.value.every((candidate) => getProcessStatus(candidate) !== 'unprocessed');
});
const selectedMission = computed<MissionSelection | undefined>(() => {
    return missionOptions.value.find((option) => option.key === selectedMissionKey.value)?.mission;
});
const terrainMissionRows = computed<TerrainMissionRow[]>(() => {
    const ignored = new Set(missionDecisionState.value.ignoredTerrainModNames);
    const processed = new Set(missionDecisionState.value.processedTerrainModNames);
    const selectedMissionDecision = missionDecisionState.value.selectedMission;
    const activeTerrainDetections = terrainDetections.value.filter((detection) => !ignored.has(detection.modFolderName) && !processed.has(detection.modFolderName));
    const activeTerrainWithMissionCount = activeTerrainDetections.filter((detection) => {
        return missionCandidates.value.some((mission) => mission.modFolderName === detection.modFolderName);
    }).length;

    return terrainDetections.value.map((detection) => {
        const primaryMission = missionCandidates.value.find((mission) => mission.modFolderName === detection.modFolderName);
        const isIgnored = ignored.has(detection.modFolderName);
        const isProcessed = processed.has(detection.modFolderName);
        const isSelected = selectedMissionDecision?.modFolderName === detection.modFolderName;
        let status: TerrainMissionStatus = 'unprocessed';
        let reason = detection.reasons.join(', ');

        if (isIgnored) {
            status = 'ignored';
            reason = tm('reasons.ignoredByUser');
        } else if (isProcessed) {
            status = 'processed';
            reason = tm('reasons.processedByUser');
        } else if (isSelected) {
            status = 'selected';
            reason = tm('reasons.selectedMission');
        } else if (!primaryMission) {
            status = 'missing';
            reason = tm('reasons.missionMissing');
        } else if (activeTerrainWithMissionCount > 1) {
            status = 'conflict';
            reason = tm('reasons.missionConflict');
        } else {
            status = 'ready';
            reason = tm('reasons.missionReady');
        }

        return {
            modFolderName: detection.modFolderName,
            confidence: detection.confidence,
            primaryMission,
            missionLabel: primaryMission
                ? `${primaryMission.missionFolderName}${primaryMission.isImported ? ` (${tm('mission.imported')})` : ''}`
                : tm('mission.notFound'),
            status,
            statusLabel: getTerrainMissionStatusLabel(status),
            reason
        };
    });
});
const hasMissionConflict = computed(() => terrainMissionRows.value.some((row) => row.status === 'conflict'));
const missionAllHandled = computed(() => {
    return terrainMissionRows.value.every((row) => {
        return row.status === 'selected'
            || row.status === 'ready'
            || row.status === 'ignored'
            || row.status === 'processed';
    }) && !hasMissionConflict.value;
});
const canRunMount = computed(() => {
    const canMountFiles = mountItems.value.length > 0 && Boolean(selectedMission.value);
    const canFinishWithoutMount = mountItems.value.length === 0 && allCandidatesHandled.value;
    return (canMountFiles || canFinishWithoutMount)
        && missionAllHandled.value
        && !isScanning.value
        && !isRunning.value;
});
const primaryActionText = computed(() => mountItems.value.length > 0 ? tm('mount') : tm('done'));

function resolveModFolderName(createdRootPath: string): string {
    if (!serverConfigFile.server_folder_path) {
        return '';
    }

    const serverRoot = serverConfigFile.server_folder_path;
    const normalizedPath = createdRootPath.replaceAll('\\', '/');
    const normalizedRoot = serverRoot.replaceAll('\\', '/');
    const createdFolderSegment = `/${CREATED_CONFIG_FOLDER_NAME}`;
    return normalizedPath.substring(
        normalizedPath.indexOf(`${normalizedRoot}/`) + normalizedRoot.length + 1,
        normalizedPath.indexOf(createdFolderSegment)
    );
}

function countByMod(modFolderName: string): number {
    if (modFolderName === 'ALL') {
        return candidates.value.length;
    }

    return candidates.value.filter((candidate) => candidate.modFolderName === modFolderName).length;
}

function isCandidateSelected(candidate: ModCeFileCandidate): boolean {
    return selectedCandidatePaths.value.has(candidate.sourcePath);
}

function toggleCandidateSelection(candidate: ModCeFileCandidate, checked: boolean) {
    const nextSelectedPaths = new Set(selectedCandidatePaths.value);
    if (checked) {
        nextSelectedPaths.add(candidate.sourcePath);
    } else {
        nextSelectedPaths.delete(candidate.sourcePath);
    }
    selectedCandidatePaths.value = nextSelectedPaths;
}

function setVisibleCandidatesSelected(checked: boolean) {
    const nextSelectedPaths = new Set(selectedCandidatePaths.value);
    for (const candidate of visibleCandidates.value) {
        if (checked) {
            nextSelectedPaths.add(candidate.sourcePath);
        } else {
            nextSelectedPaths.delete(candidate.sourcePath);
        }
    }
    selectedCandidatePaths.value = nextSelectedPaths;
}

function clearSelectedCandidates() {
    selectedCandidatePaths.value = new Set<string>();
}

function pruneSelectedCandidates() {
    const availablePaths = new Set(candidates.value.map((candidate) => candidate.sourcePath));
    selectedCandidatePaths.value = new Set(
        Array.from(selectedCandidatePaths.value).filter((path) => availablePaths.has(path))
    );
}

function getTerrainMissionStatusLabel(status: TerrainMissionStatus): string {
    return tm(`status.${status}`);
}

type CandidateProcessStatus = 'waiting_to_mount' | 'processed' | 'ignored' | 'unprocessed';

function getProcessStatus(candidate: ModCeFileCandidate): CandidateProcessStatus {
    if (candidate.confidence === 'ignored' || candidate.processStatus === 'ignored') {
        return 'ignored';
    }

    return candidate.processStatus || 'unprocessed';
}

function getProcessStatusLabel(candidate: ModCeFileCandidate): string {
    return tm(`status.${getProcessStatus(candidate)}`);
}

function getCandidateReasonLabel(reason?: string): string {
    if (!reason) {
        return '-';
    }

    const reasonKey = xmlReasonKeyMap[reason];
    return reasonKey ? tm(`xmlReasons.${reasonKey}`) : reason;
}

function buildDetectedMissionKey(candidate: Pick<MapMissionCandidate, 'sourcePath'>): string {
    return `detected:${candidate.sourcePath}`;
}

async function refreshMissionDecisionState() {
    const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'getMissionDecisionState', serverConfigFile.server_folder_path);
    missionDecisionState.value = {
        ignoredTerrainModNames: [],
        processedTerrainModNames: [],
        ...(res.data || {})
    };
}

async function useMission(row: TerrainMissionRow) {
    if (!row.primaryMission) {
        return;
    }

    try {
        const res: ResData = await window.ipcRenderer.invoke(
            'serverAPI',
            'saveSelectedMissionCandidate',
            serverConfigFile.server_folder_path,
            {
                modFolderName: row.primaryMission.modFolderName,
                missionFolderName: row.primaryMission.missionFolderName,
                sourcePath: row.primaryMission.sourcePath,
                isImported: row.primaryMission.isImported
            }
        );
        missionDecisionState.value = res.data;
        selectedMissionKey.value = buildDetectedMissionKey(row.primaryMission);
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function ignoreTerrain(modFolderName: string) {
    try {
        const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'saveIgnoredTerrainMod', serverConfigFile.server_folder_path, modFolderName);
        missionDecisionState.value = res.data;
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function unignoreTerrain(modFolderName: string) {
    try {
        const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'removeIgnoredTerrainMod', serverConfigFile.server_folder_path, modFolderName);
        missionDecisionState.value = res.data;
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function processTerrain(modFolderName: string) {
    try {
        const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'saveProcessedTerrainMod', serverConfigFile.server_folder_path, modFolderName);
        missionDecisionState.value = res.data;
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function unprocessTerrain(modFolderName: string) {
    try {
        const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'removeProcessedTerrainMod', serverConfigFile.server_folder_path, modFolderName);
        missionDecisionState.value = res.data;
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

function openTerrainContextMenu(event: MouseEvent, row: TerrainMissionRow) {
    closeCandidateContextMenu();
    terrainContextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        row
    };
}

function closeTerrainContextMenu() {
    terrainContextMenu.value.visible = false;
}

function closeAllContextMenus() {
    closeCandidateContextMenu();
    closeTerrainContextMenu();
}

async function useContextTerrainMission() {
    const row = terrainContextMenu.value.row;
    closeTerrainContextMenu();
    if (row) {
        await useMission(row);
    }
}

async function ignoreContextTerrain() {
    const row = terrainContextMenu.value.row;
    closeTerrainContextMenu();
    if (row) {
        await ignoreTerrain(row.modFolderName);
    }
}

async function unignoreContextTerrain() {
    const row = terrainContextMenu.value.row;
    closeTerrainContextMenu();
    if (row) {
        await unignoreTerrain(row.modFolderName);
    }
}

async function processContextTerrain() {
    const row = terrainContextMenu.value.row;
    closeTerrainContextMenu();
    if (row) {
        await processTerrain(row.modFolderName);
    }
}

async function unprocessContextTerrain() {
    const row = terrainContextMenu.value.row;
    closeTerrainContextMenu();
    if (row) {
        await unprocessTerrain(row.modFolderName);
    }
}

function openFilePreview(candidate: ModCeFileCandidate) {
    const displayPath = candidate.mountSourcePath || candidate.createdCopyPath || candidate.sourcePath;
    window.ipcRenderer.invoke(
        'showTextFilePreview',
        displayPath,
        candidate.fileName,
        serverConfigFile.server_folder_path,
        candidate.modFolderName,
        candidate.selectedType,
        candidate.sourcePath
    );
}

function openFileEditor(candidate: ModCeFileCandidate) {
    const displayPath = candidate.mountSourcePath || candidate.createdCopyPath || candidate.sourcePath;
    window.ipcRenderer.invoke(
        'showTextFileEditor',
        displayPath,
        candidate.fileName,
        serverConfigFile.server_folder_path,
        candidate.modFolderName,
        candidate.selectedType,
        candidate.sourcePath
    );
}

function openCandidateContextMenu(event: MouseEvent, candidate: ModCeFileCandidate) {
    closeTerrainContextMenu();
    candidateContextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        candidate
    };
}

function closeCandidateContextMenu() {
    candidateContextMenu.value.visible = false;
}

function previewContextCandidate() {
    const candidate = candidateContextMenu.value.candidate;
    closeCandidateContextMenu();
    if (candidate) {
        openFilePreview(candidate);
    }
}

function editContextCandidate() {
    const candidate = candidateContextMenu.value.candidate;
    closeCandidateContextMenu();
    if (candidate) {
        openFileEditor(candidate);
    }
}

async function ignoreContextCandidate() {
    const candidate = candidateContextMenu.value.candidate;
    closeCandidateContextMenu();
    if (!candidate) {
        return;
    }

    try {
        const reason = tm('reasons.ignoredByUser');
        await window.ipcRenderer.invoke(
            'serverAPI',
            'saveIgnoredCeConfigCandidate',
            serverConfigFile.server_folder_path,
            candidate.modFolderName,
            candidate.sourcePath,
            reason
        );
        candidate.confidence = 'ignored';
        candidate.enabled = false;
        candidate.processStatus = 'ignored';
        candidate.reason = reason;
        candidate.warning = reason;
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function saveIgnoredCandidate(candidate: ModCeFileCandidate, reason = tm('reasons.ignoredByUser')) {
    await window.ipcRenderer.invoke(
        'serverAPI',
        'saveIgnoredCeConfigCandidate',
        serverConfigFile.server_folder_path,
        candidate.modFolderName,
        candidate.sourcePath,
        reason
    );
    candidate.confidence = 'ignored';
    candidate.enabled = false;
    candidate.processStatus = 'ignored';
    candidate.reason = reason;
    candidate.warning = reason;
}

async function saveProcessedCandidate(candidate: ModCeFileCandidate, reason = tm('reasons.processedByUser')) {
    await window.ipcRenderer.invoke(
        'serverAPI',
        'saveProcessedCeConfigCandidate',
        serverConfigFile.server_folder_path,
        candidate.modFolderName,
        candidate.sourcePath,
        reason
    );
    candidate.processStatus = 'processed';
}

async function removeProcessedCandidate(candidate: ModCeFileCandidate) {
    await window.ipcRenderer.invoke(
        'serverAPI',
        'removeProcessedCeConfigCandidate',
        serverConfigFile.server_folder_path,
        candidate.modFolderName,
        candidate.sourcePath
    );
}

async function removeIgnoredCandidate(candidate: ModCeFileCandidate) {
    await window.ipcRenderer.invoke(
        'serverAPI',
        'removeIgnoredCeConfigCandidate',
        serverConfigFile.server_folder_path,
        candidate.modFolderName,
        candidate.sourcePath
    );
}

async function batchIgnoreCandidates() {
    try {
        const selected = [...selectedCandidates.value];
        for (const candidate of selected) {
            if (getProcessStatus(candidate) !== 'ignored') {
                await saveIgnoredCandidate(candidate);
            }
        }
        clearSelectedCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function batchProcessCandidates() {
    try {
        const selected = [...selectedCandidates.value];
        let shouldRescan = false;
        for (const candidate of selected) {
            if (candidate.processStatus !== 'processed') {
                shouldRescan = shouldRescan || candidate.confidence === 'ignored';
                await saveProcessedCandidate(candidate);
            }
        }
        clearSelectedCandidates();
        if (shouldRescan) {
            await scanCandidates();
        }
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function batchUnignoreCandidates() {
    try {
        const selected = [...selectedCandidates.value];
        let shouldRescan = false;
        for (const candidate of selected) {
            if (getProcessStatus(candidate) === 'ignored') {
                shouldRescan = true;
                await removeIgnoredCandidate(candidate);
            }
        }
        clearSelectedCandidates();
        if (shouldRescan) {
            await scanCandidates();
        }
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function batchUnprocessCandidates() {
    try {
        const selected = [...selectedCandidates.value];
        let shouldRescan = false;
        for (const candidate of selected) {
            if (candidate.processStatus === 'processed') {
                shouldRescan = true;
                await removeProcessedCandidate(candidate);
            }
        }
        clearSelectedCandidates();
        if (shouldRescan) {
            await scanCandidates();
        }
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function processContextCandidate() {
    const candidate = candidateContextMenu.value.candidate;
    closeCandidateContextMenu();
    if (!candidate) {
        return;
    }

    try {
        await saveProcessedCandidate(candidate);
        if (candidate.confidence === 'ignored') {
            await scanCandidates();
            return;
        }
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function unprocessContextCandidate() {
    const candidate = candidateContextMenu.value.candidate;
    closeCandidateContextMenu();
    if (!candidate) {
        return;
    }

    try {
        await removeProcessedCandidate(candidate);
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function unignoreContextCandidate() {
    const candidate = candidateContextMenu.value.candidate;
    closeCandidateContextMenu();
    if (!candidate) {
        return;
    }

    try {
        await window.ipcRenderer.invoke(
            'serverAPI',
            'removeIgnoredCeConfigCandidate',
            serverConfigFile.server_folder_path,
            candidate.modFolderName,
            candidate.sourcePath
        );
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function ensureToolCreatedFolderPathMap() {
    if (toolCreatedFolderPathMap.value.size > 0 || !serverConfigFile.server_folder_path) {
        return;
    }

    const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'discoverToolCreatedConfigFolders', serverConfigFile.server_folder_path);
    const discoveredMap = new Map<string, string[]>();
    for (const item of res.data || []) {
        discoveredMap.set(item.createdRootPath, item.configFolderPaths);
    }
    toolCreatedFolderPathMap.value = discoveredMap;
    store.commit('updateToolCreatedFolderPathMap', discoveredMap);
}

async function scanMissionOptions(modFolderNamesToScan: string[]) {
    const options: Array<{ key: string; label: string; mission: MissionSelection; isDetectedMap: boolean; modFolderName?: string }> = [];
    const detectedMissionModNames = new Set<string>();

    let configMissionFolderName = '';
    if (serverConfigFile.server_map_mission_path) {
        try {
            const pathSep = await getPathSep();
            const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'pathMissionsFolderValidate', serverConfigFile.server_map_mission_path);
            configMissionFolderName = res.data;
            options.push({
                key: `config:${serverConfigFile.server_map_mission_path}`,
                label: `${configMissionFolderName} (${tm('mission.configured')})`,
                mission: {
                    missionFolderName: configMissionFolderName,
                    sourcePath: `${serverConfigFile.server_map_mission_path}${pathSep}${configMissionFolderName}`
                },
                isDetectedMap: true
            });
        } catch {
            // Invalid legacy mission path should not block scanning mod candidates.
        }
    }

    const discoveredRes: ResData = await window.ipcRenderer.invoke(
        'serverAPI',
        'discoverMapMissionCandidates',
        serverConfigFile.server_folder_path,
        modFolderNamesToScan
    );
    const discoveredCandidates: MapMissionCandidate[] = discoveredRes.data || [];
    missionCandidates.value = discoveredCandidates;
    for (const candidate of discoveredCandidates) {
        const key = buildDetectedMissionKey(candidate);
        if (options.some((option) => option.key === key)) {
            continue;
        }

        detectedMissionModNames.add(candidate.modFolderName);
        options.push({
            key,
            label: `${candidate.missionFolderName} (${candidate.modFolderName}${candidate.isImported ? `, ${tm('mission.imported')}` : ''})`,
            modFolderName: candidate.modFolderName,
            mission: {
                missionFolderName: candidate.missionFolderName,
                sourcePath: candidate.isImported ? undefined : candidate.sourcePath,
                updateServerConfig: true
            },
            isDetectedMap: true
        });
    }

    const defaultMissionFolderName = configMissionFolderName || 'dayzOffline.chernarusplus';
    options.unshift({
        key: `server:${defaultMissionFolderName}`,
        label: `${defaultMissionFolderName} (${tm('mission.serverDefault')})`,
        mission: {
            missionFolderName: defaultMissionFolderName
        },
        isDetectedMap: false
    });

    missionOptions.value = options;
    missionCandidateModNames.value = detectedMissionModNames;
    const ignoredTerrainMods = new Set(missionDecisionState.value.ignoredTerrainModNames);
    const processedTerrainMods = new Set(missionDecisionState.value.processedTerrainModNames);
    const detectedMapOptions = options.filter((option) => {
        return option.isDetectedMap
            && option.modFolderName
            && !ignoredTerrainMods.has(option.modFolderName)
            && !processedTerrainMods.has(option.modFolderName);
    });
    const selectedDecision = missionDecisionState.value.selectedMission;
    const selectedDecisionOption = selectedDecision
        ? options.find((option) => {
            return option.isDetectedMap
                && option.mission.missionFolderName === selectedDecision.missionFolderName
                && option.modFolderName === selectedDecision.modFolderName;
        })
        : undefined;
    if (selectedDecisionOption) {
        selectedMissionKey.value = selectedDecisionOption.key;
    } else if (detectedMapOptions.length === 1) {
        selectedMissionKey.value = detectedMapOptions[0].key;
    } else if (detectedMapOptions.length > 1) {
        selectedMissionKey.value = undefined;
    } else {
        selectedMissionKey.value = options[0]?.key;
    }
}

async function scanTerrainDetections(modFolderNamesToScan: string[]) {
    const res: ResData = await window.ipcRenderer.invoke(
        'serverAPI',
        'detectTerrainResourceMods',
        serverConfigFile.server_folder_path,
        modFolderNamesToScan
    );
    terrainDetections.value = res.data || [];
}

async function importMissionTemplateForMod(modFolderName: string) {
    try {
        const selectedPath = await window.ipcRenderer.invoke('showOpenDirectoryDialog', tm('mission.selectTemplateFolder'));
        if (!selectedPath) {
            return;
        }

        await window.ipcRenderer.invoke(
            'serverAPI',
            'importMissionTemplate',
            serverConfigFile.server_folder_path,
            modFolderName,
            selectedPath
        );
        await scanCandidates();
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    }
}

async function scanCandidates() {
    if (!serverConfigFile.server_folder_path) {
        globalErrorHandler(tm('errors.serverFolderEmpty'));
        return;
    }

    isScanning.value = true;
    try {
        await ensureToolCreatedFolderPathMap();
        const pathSep = await getPathSep();
        const names = modFolderNames.value.filter((name) => name !== 'ALL');
        await refreshMissionDecisionState();
        await scanMissionOptions(names);
        await scanTerrainDetections(names);
        const res: ResData = await window.ipcRenderer.invoke('serverAPI', 'scanModCeConfigFiles', serverConfigFile.server_folder_path, names);
        candidates.value = (res.data || []).map((candidate: ModCeFileCandidate) => ({
            ...candidate,
            sourcePath: candidate.sourcePath.split(pathSep).join(pathSep)
        }));
        pruneSelectedCandidates();
        selectedModFolderName.value = 'ALL';
    } catch (error: any) {
        globalErrorHandler(error?.message || error?.toString() || error);
    } finally {
        isScanning.value = false;
    }
}

async function start() {
    clearIpcListeners();

    receiveIpc('os-service-process-error', (errMsg: string) => {
        isRunning.value = false;
        globalErrorHandler(errMsg);
    });

    await runModMountWorkflow({
        configFile: serverConfigFile,
        createdFolderPathMap: toolCreatedFolderPathMap.value,
        stageTitles,
        receiveIpc,
        mountItems: mountItems.value,
        missionSelection: selectedMission.value,
        onProgressChange: (progress) => {
            percent.value = progress;
        },
        onStageTitleChange: (stageTitle) => {
            processTitle.value = stageTitle;
        },
        onCopyingFileChange: (srcPath, targetPath) => {
            processSrcPath.value = srcPath;
            processTargetPath.value = targetPath;
        },
        onFileCountIncrement: (count) => {
            processFileCount.value += count;
        },
        onFileCountReset: () => {
            processFileCount.value = 0;
        },
        onCountingChange: (counting) => {
            isCounting.value = counting;
        }
    });

    if (serverConfigFile.id) {
        await updateConfigStatus(serverConfigFile.id, 'ce_mounted');
        serverConfigFile.config_status = 'ce_mounted';
    }
    isComplete.value = true;
}

function back() {
    router.push('/ModChoose');
}

async function next() {
    if (mountItems.value.length === 0) {
        if (!allCandidatesHandled.value) {
            globalErrorHandler(tm('errors.unprocessedFiles'));
            return;
        }
        isComplete.value = true;
        return;
    }

    if (!missionAllHandled.value) {
        globalErrorHandler(tm('errors.unprocessedMission'));
        return;
    }

    const skippedCount = candidates.value.length - mountItems.value.length;
    if (skippedCount > 0) {
        const confirmed = await confirmNativeDialog({
            title: tm('dialogs.mountHighConfidenceTitle'),
            message: tm('dialogs.mountHighConfidenceMessage', { mountCount: mountItems.value.length, skippedCount }),
            confirmText: tm('actions.continue'),
            cancelText: i18n.global.t('common.modal.confirm.cancel'),
        });
        if (!confirmed) {
            return;
        }
    }

    isRunning.value = true;
    isComplete.value = false;
    percent.value = 0;
    start().finally(() => {
        isRunning.value = false;
    });
}

function completedNext() {
    router.push('/SelectType');
}

scanCandidates();
savedIpcListeners.receiveIpc('ce-manual-confirmation-saved', () => {
    scanCandidates();
});
window.addEventListener('click', closeAllContextMenus);
window.addEventListener('blur', closeAllContextMenus);
window.addEventListener('contextmenu', closeAllContextMenus);
window.addEventListener('scroll', closeAllContextMenus, true);
onBeforeUnmount(() => {
    window.removeEventListener('click', closeAllContextMenus);
    window.removeEventListener('blur', closeAllContextMenus);
    window.removeEventListener('contextmenu', closeAllContextMenus);
    window.removeEventListener('scroll', closeAllContextMenus, true);
});
</script>

<style lang="less" scoped>
#ModMountConfig {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-width: 100%;
}

.view-content {
    flex: 1;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    overflow: hidden;
}

.mount-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    min-width: 0;
    overflow-x: hidden;
}

.summary-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    opacity: 0.86;
}

.mission-select-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.mission-select {
    width: 280px;
}

.mission-panel {
    border: 1px solid var(--app-color-border-secondary);
    border-radius: var(--app-border-radius);
    padding: 8px;
    background: var(--app-color-bg-container);
}

.mission-panel h3 {
    margin: 0;
}

.mission-warning {
    color: var(--app-color-warning);
    font-size: 12px;
}

.terrain-confidence {
    text-transform: uppercase;
}

.terrain-confidence.high {
    color: var(--app-color-success);
}

.terrain-confidence.medium {
    color: var(--app-color-warning);
}

.terrain-confidence.low {
    color: var(--app-color-error);
}

.terrain-confidence.ignored {
    color: var(--app-color-text-secondary);
}

.mission-status.selected,
.mission-status.ready,
.mission-status.processed {
    color: var(--app-color-success);
}

.mission-status.conflict,
.mission-status.missing {
    color: var(--app-color-warning);
}

.mission-status.ignored {
    color: var(--app-color-text-secondary);
}

.mission-status.unprocessed {
    color: var(--app-color-error);
}

.row-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
}

.row-actions button {
    min-height: 24px;
    padding: 0 6px;
    color: var(--app-color-text);
    background: var(--app-color-bg-container);
    border: 1px solid var(--app-color-border-secondary);
    cursor: pointer;
}

.row-actions button:hover {
    color: var(--app-color-text-heading);
    background: var(--app-color-hover-bg);
}

.row-actions button:disabled {
    color: var(--app-color-text-secondary);
    cursor: not-allowed;
    opacity: 0.72;
}

.workbench {
    display: grid;
    grid-template-columns: 220px minmax(420px, 1fr);
    gap: 8px;
    min-height: 0;
    min-width: 0;
    flex: 1;
}

.mod-list,
.candidate-list {
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid var(--app-color-border-secondary);
    border-radius: var(--app-border-radius);
    padding: 8px;
    background: var(--app-color-bg-container);
    overflow: auto;
}

.mod-list h3,
.candidate-list h3 {
    margin: 0 0 12px;
}

.mod-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 28px;
    margin-bottom: 4px;
    padding: 4px 6px;
    color: inherit;
    background: var(--app-color-bg-content);
    border: 1px solid var(--app-color-border-secondary);
    border-radius: var(--app-border-radius);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.mod-list-item:not(.active):hover {
    border-color: var(--app-color-primary);
}

.mod-list-item.active {
    border-color: var(--app-color-primary);
    color: var(--app-color-text-heading);
    background: var(--app-color-primary);
}

.mod-list-item.active strong {
    color: var(--app-color-text-heading);
}

.table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
}

.table-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 4px;
}

.selected-count {
    color: var(--app-color-text-secondary);
    font-size: 12px;
    white-space: nowrap;
}

.table-wrap {
    min-width: 0;
    overflow: auto;
    background: var(--app-color-bg-container);
}

table {
    width: 100%;
    border-collapse: collapse;
    background: var(--app-color-bg-container);
}

th,
td {
    padding: 5px 6px;
    border-bottom: 1px solid var(--app-color-divider);
    text-align: left;
    vertical-align: middle;
    background: var(--app-color-bg-container);
}

th {
    background: var(--app-color-bg-content);
}

.file-name-button {
    max-width: 180px;
    padding: 0;
    border: none;
    color: var(--app-color-text-heading);
    background: transparent;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
}

.file-name-button:hover {
    color: var(--app-color-primary);
}

.type-select {
    width: 150px;
}

.candidate-row {
    cursor: default;
}

.candidate-row:not(.context-menu-open):hover td,
.candidate-row.context-active td {
    background: var(--app-color-hover-bg);
}

.terrain-row:hover td,
.terrain-row.context-active td {
    background: var(--app-color-hover-bg);
}

.candidate-context-menu {
    position: fixed;
    z-index: 3000;
    width: 110px;
    padding: 4px 0;
    border: 1px solid var(--app-color-border-secondary);
    background: var(--app-color-bg-elevated);
    box-shadow: var(--app-shadow-elevated);
}

.candidate-context-menu-motion-enter-active,
.candidate-context-menu-motion-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
    transform-origin: top left;
}

.candidate-context-menu-motion-enter-from,
.candidate-context-menu-motion-leave-to {
    opacity: 0;
    transform: scale(0.96);
}

.candidate-context-menu-motion-enter-to,
.candidate-context-menu-motion-leave-from {
    opacity: 1;
    transform: scale(1);
}

.candidate-context-menu button {
    width: 100%;
    min-height: 24px;
    padding: 0 8px;
    border: none;
    color: var(--app-color-text);
    background: transparent;
    cursor: default;
    text-align: center;
}

.candidate-context-menu button:hover {
    color: var(--app-color-text-heading);
    background: var(--app-color-hover-bg);
}

.confidence {
    text-transform: uppercase;
}

.confidence.high {
    color: var(--app-color-success);
}

.confidence.medium {
    color: var(--app-color-warning);
}

.confidence.low {
    color: var(--app-color-error);
}

.confidence.ignored {
    color: var(--app-color-text-secondary);
}

.process-status {
    text-transform: none;
}

.process-status.waiting_to_mount {
    color: var(--app-color-link);
}

.process-status.processed {
    color: var(--app-color-success);
}

.process-status.ignored {
    color: var(--app-color-text-secondary);
}

.process-status.unprocessed {
    color: var(--app-color-error);
}

.empty-cell {
    padding: 16px 6px;
    opacity: 0.68;
    text-align: center;
}

.process-bar-area {
    text-align: left;
}
</style>
