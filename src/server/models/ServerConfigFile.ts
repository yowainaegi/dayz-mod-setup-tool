export default interface ServerConfigFile {
    id: number | null,
    server_id: string | null,
    server_name: string | null,
    config_file_name: string | null,
    pure_server_folder_path: string | null,
    server_folder_path: string | null,
    deploy_server_folder_path: string | null,
    preset_file_name: string | null,
    server_profile_folder: string | null,
    server_map_mission_path: string | null
}