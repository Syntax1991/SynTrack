export type ClientDownloadInfo =
  | {
      available: true;
      fileName: string;
      version: string | null;
      sizeBytes: number;
      releasedAt: string;
    }
  | {
      available: false;
    };
