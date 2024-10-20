export default interface PresetInfo {
    addonsPresets: addonsPresets
}

interface addonsPresets {
    lastUpdate: string[];
    publishedIds: IdList[];
}

interface IdList {
    id: string[];
}