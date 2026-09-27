import express from "express";
import helmet from "helmet";
import cors from "cors";
import fs from "node:fs";

import { apiRouter } from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import ApiError from "./utils/apiError.js";
import activityAudit from "./middlewares/activity.middleware.js";
import { recordUsageFireAndForget } from "./services/usage.service.js";
import { UPLOADS_DIR } from "./config/upload.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Private uploads dir (payment screenshots) — created lazily so a
  // fresh checkout works without a setup step.
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // ---- platform-owner instrumentation ----
  // Daily usage heartbeat: one AppSession row per shop per UTC day.
  app.use((req, res, next) => {
    res.on("finish", () => {
      if (req.shopId) {
        recordUsageFireAndForget({
          shopId: req.shopId,
          userId: req.user?.userId ?? null,
          req,
        });
      }
    });
    next();
  });
  // Full audit trail: one ActivityEvent per request (fire-and-forget).
  app.use(activityAudit);

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/v1/", apiRouter);

  app.use((req, res, next) => next(ApiError.notFound("Route not found")));
  app.use(errorMiddleware);

  return app;
}

export default createApp;
