const CREATED_CONFIG_FOLDER_NAME = 'DAYZ_MOD_SETUP_TOOL_CREATED';

const MOD_FOLDER_NAME = {
    KEYS: 'Keys',
    KEY: 'Key'
} as const;

const TASK_MODE = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE'
} as const;

const MOD_MOUNT_MODE = {
    COPY: 'copy',
    JUNCTION: 'junction'
} as const;

const MOD_CONFIG_FOLDERS = [
    'types',
    'spawnabletypes',
    'globals',
    'economy',
    'events',
    'messages',
    'map_missions'
] as const;

const CE_CONFIG_TYPES = [
    'types',
    'spawnabletypes',
    'globals',
    'economy',
    'events',
    'messages'
] as const;

export {
    CREATED_CONFIG_FOLDER_NAME,
    MOD_FOLDER_NAME,
    TASK_MODE,
    MOD_MOUNT_MODE,
    MOD_CONFIG_FOLDERS,
    CE_CONFIG_TYPES
};
