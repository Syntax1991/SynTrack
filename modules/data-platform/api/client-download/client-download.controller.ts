import type { RequestHandler } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ClientDownloadService } from "./client-download.service.js";

export class ClientDownloadController {
  constructor(
    private readonly service: ClientDownloadService
  ) {}

  getInfo: RequestHandler = async (
    _request,
    response
  ) => {
    response.json(
      await this.service.getInfo()
    );
  };

  downloadFile: RequestHandler = async (
    _request,
    response
  ) => {
    const latest = await this.service.findLatest();

    if (!latest) {
      throw new AppError(
        404,
        "No client installer is currently available for download."
      );
    }

    response.download(
      latest.filePath,
      latest.fileName
    );
  };
}
