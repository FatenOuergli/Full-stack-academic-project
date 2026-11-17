import { AppError } from '../utils/AppError.js';

// Reached only when no route matched: turns unknown URLs into the standard error shape.
export function notFound(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}
