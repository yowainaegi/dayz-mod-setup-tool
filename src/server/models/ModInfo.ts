export default interface ModInfo {
    key: string;
    Id: string;
    DisplayName: string;
    Author: string;
    CanBeAutoupdated: boolean;
    CanBeRemoved: boolean;
    CanBeRepaired: boolean;
    ExtensionPath: string;
    ExtensionType: number;
    FileSystemSpaceRequired: number;
    IsAutomaticUpdateEnabled: boolean;
    IsExpanded: boolean;
    IsFileSystemObjectRequired: boolean;
    IsUpdateAvailable: boolean;
    LastUpdateDate: string; // Assuming it's a date string
    Url: string;
    ModMetadataName: string;
    previewImageMain: string;
    StorageInfo: {
      CachedPreviewImage: {
        OriginalPath: string;
        FullPath: string;
        ImageJsonData: string;
      } | null;
      DisplayName: string;
      FileHandle: number;
      FileSystemSize: number;
      InSitu: boolean;
      IsUgcContent: boolean;
      LastUpdate: number;
      LegacyFileName: null | string;
      ModCustomizationEnabled: boolean;
      OwnerUserId: number;
      PreviewImageFileHandle: number;
      PublishTimestamp: number;
      PublishedId: number;
    };
    IsInstalled: boolean;
    SteamDependencies: string[]; // Assuming it's an array of strings
    AddedStatus: number; // show status, 0 is subscribed, 1 is added at config file
    SearchedStatus: number; // search status, 0 is be searched, 1 is not be searched
    CanBeRemovedDZMSUTool: boolean;
}