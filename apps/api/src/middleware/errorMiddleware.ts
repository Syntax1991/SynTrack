import type {
  ErrorRequestHandler
} from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError.js";

export const errorMiddleware:
  ErrorRequestHandler = (
    error: unknown,
    _request,
    response,
    _next
  ) => {
    if (error instanceof AppError) {
      response
        .status(error.statusCode)
        .json({
          error: error.message,
          details: error.details
        });

      return;
    }

    if (error instanceof ZodError) {
      response.status(400).json({
        error:
          "Die übermittelten Daten sind ungültig.",
        details: error.flatten()
      });

      return;
    }

    /*
     * express.json() rejects a malformed body with a client error
     * (body-parser sets expose + a 4xx status). Answer with a controlled
     * 4xx instead of the generic 500, without echoing the parser detail.
     */
    if (isExposedClientError(error)) {
      response.status(error.status).json({
        error:
          "Die übermittelten Daten sind ungültig."
      });

      return;
    }

    console.error(error);

    response.status(500).json({
      error:
        "Ein interner Serverfehler ist aufgetreten."
    });
  };

function isExposedClientError(
  error: unknown
): error is { status: number } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate =
    error as { status?: unknown; expose?: unknown };

  return (
    candidate.expose === true &&
    typeof candidate.status === "number" &&
    candidate.status >= 400 &&
    candidate.status < 500
  );
}
