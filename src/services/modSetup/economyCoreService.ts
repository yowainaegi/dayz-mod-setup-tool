import { getConfigFileNameList } from "@/server/api/ModMountConfigApi";
import { NormalConfigFolder } from "./types";

function isXmlFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.xml');
}

function buildCeRefKey(folder: string, fileName: string, type: string): string {
    return `${folder}::${fileName}::${type}`;
}

function collectExistingCeRefs(ceList: any[]): Set<string> {
    const refs = new Set<string>();
    for (const ceItem of ceList) {
        const folder = ceItem?.$?.folder;
        const files = Array.isArray(ceItem?.file) ? ceItem.file : [];
        if (!folder) {
            continue;
        }

        for (const file of files) {
            const fileName = file?.$?.name;
            const type = file?.$?.type;
            if (fileName && type) {
                refs.add(buildCeRefKey(folder, fileName, type));
            }
        }
    }

    return refs;
}

async function appendConfigFoldersToEconomyCore(economyCoreContent: any, configFolders: NormalConfigFolder[]): Promise<void> {
    if (!economyCoreContent.economycore.ce) {
        economyCoreContent.economycore.ce = [];
    }

    const existingCeRefs = collectExistingCeRefs(economyCoreContent.economycore.ce);

    for (const configFolder of configFolders) {
        const configFileNameList = await getConfigFileNameList(configFolder.path);
        if (!configFileNameList || configFileNameList.length < 1) {
            continue;
        }

        const ceFolder = `${configFolder.modFolderName}/${configFolder.type}`;
        const cdItem: { $: { folder: string }; file: any[] } = {
            $: { folder: ceFolder },
            file: []
        };

        for (const file of configFileNameList) {
            if (!isXmlFile(file.name)) {
                continue;
            }

            const ceRefKey = buildCeRefKey(ceFolder, file.name, configFolder.type);
            if (existingCeRefs.has(ceRefKey)) {
                continue;
            }

            cdItem.file.push({
                $: { name: file.name, type: configFolder.type }
            });
            existingCeRefs.add(ceRefKey);
        }

        if (cdItem.file.length > 0) {
            economyCoreContent.economycore.ce.push(cdItem);
        }
    }
}

export {
    appendConfigFoldersToEconomyCore
};
