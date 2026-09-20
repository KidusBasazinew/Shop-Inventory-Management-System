import ApiError from "../utils/apiError.js";

function errorMiddleware(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? undefined,
    });
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({
      error: `A record with this ${err.meta?.target?.join(", ")} already exists`,
    });
  }

  // Prisma "record not found" on update/delete
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  console.error(err); // wire this to real logging (pino/winston) in production
  return res.status(500).json({ error: "Internal server error" });
}

export default errorMiddleware;
