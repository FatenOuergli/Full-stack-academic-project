// Router-level middleware: checks req.params, req.query and req.body against Zod schemas.
// Valid, cleaned values (types converted, unknown fields removed) go to req.validated;
// invalid input becomes a ZodError, which errorHandler turns into 422 VALIDATION_ERROR.
export const validate = (schemas) => (req, _res, next) => {
  try {
    req.validated = {};
    for (const part of ['params', 'query', 'body']) {
      if (schemas[part]) req.validated[part] = schemas[part].parse(req[part]);
    }
    next();
  } catch (err) {
    next(err);
  }
};
