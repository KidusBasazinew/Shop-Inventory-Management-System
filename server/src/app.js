import express from "express";
import helmet from "helmet";
import cors from "cors";

import { apiRouter } from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import ApiError from "./utils/apiError.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/v1/", apiRouter);

  app.use((req, res, next) => next(ApiError.notFound("Route not found")));
  app.use(errorMiddleware);

  return app;
}

export default createApp;
