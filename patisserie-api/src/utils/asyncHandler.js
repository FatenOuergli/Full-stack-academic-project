// Express 4 does not catch rejected promises: this wrapper forwards them to next()
// so async errors reach the error-handling middleware.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
