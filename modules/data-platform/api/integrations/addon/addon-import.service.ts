import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { normalizeAddonSnapshot } from "./addon-import.normalizer.js";
import { AddonImportPersistence } from "./addon-import.persistence.js";
import { createAddonImportPreview } from "./addon-import.preview.js";
import type {
  AddonSnapshot
} from "./addon-import.types.js";
import { LuaSavedVariablesParser } from "./lua-saved-variables.parser.js";

const CORE_SAVED_VARIABLES_FORMAT =
  "syntrack-saved-variables";

const SUPPORTED_CORE_SCHEMA_VERSION =
  1;

const MIN_SUPPORTED_PROFESSION_SCHEMA_VERSION =
  4;

const MAX_SUPPORTED_PROFESSION_SCHEMA_VERSION =
  10;

function isSupportedSchemaVersion(
  schemaVersion: number,
  isCoreSnapshot: boolean
): boolean {
  if (isCoreSnapshot) {
    return (
      schemaVersion ===
      SUPPORTED_CORE_SCHEMA_VERSION
    );
  }

  return (
    schemaVersion >=
      MIN_SUPPORTED_PROFESSION_SCHEMA_VERSION &&
    schemaVersion <=
      MAX_SUPPORTED_PROFESSION_SCHEMA_VERSION
  );
}

function supportedSchemaDescription(
  isCoreSnapshot: boolean
): string {
  return isCoreSnapshot
    ? String(
        SUPPORTED_CORE_SCHEMA_VERSION
      )
    : `${MIN_SUPPORTED_PROFESSION_SCHEMA_VERSION} to ${MAX_SUPPORTED_PROFESSION_SCHEMA_VERSION}`;
}

export class AddonImportService {
  constructor(
    private readonly persistence:
      AddonImportPersistence
  ) {}

  preview(
    source: string
  ) {
    const snapshot =
      this.readSnapshot(
        source
      );

    return createAddonImportPreview(
      snapshot
    );
  }

  async importSavedVariables(
    source: string,
    ownership: {
      ownerRaiderAccountId?: string | null;
    } = {}
  ) {
    const snapshot =
      this.readSnapshot(
        source
      );

    return this.persistence.persist(
      snapshot,
      ownership
    );
  }

  private readSnapshot(
    source: string
  ): AddonSnapshot {
    try {
      const root =
        new LuaSavedVariablesParser(
          source
        ).parse();

      const isCoreSnapshot =
        root.format ===
        CORE_SAVED_VARIABLES_FORMAT;

      const snapshot =
        normalizeAddonSnapshot(
          root
        );

      if (
        !isSupportedSchemaVersion(
          snapshot.schemaVersion,
          isCoreSnapshot
        )
      ) {
        throw new AppError(
          400,
          `Unsupported addon schema version ${snapshot.schemaVersion}. Supported version is ${supportedSchemaDescription(isCoreSnapshot)}.`
        );
      }

      if (
        snapshot
          .characters
          .length === 0
      ) {
        throw new AppError(
          400,
          "The SavedVariables do not contain any characters."
        );
      }

      return snapshot;
    }
    catch (error) {
      if (
        error instanceof
        AppError
      ) {
        throw error;
      }

      throw new AppError(
        400,
        "SynTrack SavedVariables could not be read.",
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }
}