import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function toAppError(err) {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return new AppError(422, 'VALIDATION_ERROR', 'Invalid input', details);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError(422, 'VALIDATION_ERROR', 'Invalid input', details);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, 'INVALID_ID', `Invalid value for ${err.path}`);
  }
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    return new AppError(409, 'DUPLICATE_KEY', `${fields.join(', ') || 'Value'} already exists`, fields);
  }
  if (err?.type === 'entity.parse.failed') {
    return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  }
  if (err?.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (err?.type === 'charset.unsupported' || err?.type === 'encoding.unsupported') {
    return new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', err.message);
  }
  // Any other client error raised by the body parser (http-errors with expose=true).
  if (err?.expose && err.status >= 400 && err.status < 500) {
    return new AppError(err.status, 'BAD_REQUEST', err.message);
  }
  return null;
}

// Error-handling middleware (4 arguments) registered last, so every error thrown
// or passed to next() anywhere ends here and leaves in the same JSON shape.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const known = toAppError(err);
  const appError = known || new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');

  if (!known && !env.isTest) console.error(err);

  const body = { status: appError.status, code: appError.code, message: appError.message };
  if (appError.details !== undefined) body.details = appError.details;
  // Stack traces help while coding but must never reach a client in production.
  if (env.isDev && !known) body.stack = err.stack;

  res.status(appError.status).json(body);
}
