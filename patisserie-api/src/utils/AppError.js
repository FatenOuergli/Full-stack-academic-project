// Operational error with an HTTP status and a stable machine-readable code.
// Thrown anywhere, it is turned into the standard error shape by errorHandler.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
