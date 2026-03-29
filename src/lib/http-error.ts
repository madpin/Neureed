/**
 * Typed HTTP error for API routes and services.
 * Throw from domain logic; map to responses in createHandler or actions.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
