import path from "node:path";
import { Router } from "express";
import { env } from "../../../../apps/api/src/config/env.js";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { ClientDownloadController } from "./client-download.controller.js";
import { ClientDownloadService } from "./client-download.service.js";

const downloadDirectory = path.resolve(
  process.cwd(),
  env.CLIENT_DOWNLOAD_DIR
);

const service = new ClientDownloadService(
  downloadDirectory
);

const controller = new ClientDownloadController(
  service
);

export const clientDownloadRouter =
  Router();

clientDownloadRouter.get(
  "/info",
  asyncHandler(
    controller.getInfo
  )
);

clientDownloadRouter.get(
  "/file",
  asyncHandler(
    controller.downloadFile
  )
);
