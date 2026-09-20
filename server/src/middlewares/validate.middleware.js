import ApiError from "../utils/apiError.js";

function setValidatedValue(req, key, value) {
  Object.defineProperty(req, key, {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

/**
 * validate({ body, params, query }) — each value is a Zod schema.
 * Parses and REPLACES req.body/params/query with the parsed (typed,
 * defaulted) result, so controllers never touch raw unvalidated input.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body)
        setValidatedValue(req, "body", schemas.body.parse(req.body));
      if (schemas.params)
        setValidatedValue(req, "params", schemas.params.parse(req.params));
      if (schemas.query)
        setValidatedValue(req, "query", schemas.query.parse(req.query));
      next();
    } catch (err) {
      const issues = err.issues ?? err.errors;
      const details = issues?.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      next(ApiError.badRequest("Validation failed", details));
    }
  };
}

export default validate;
