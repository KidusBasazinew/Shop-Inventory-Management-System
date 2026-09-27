import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/notification.controller.js";
import { markNotificationsReadSchema } from "../validations/notification.validation.js";

const router = Router();

router.use(authMiddleware);

// Available even when expired — renewal reminders must be visible.
router.get("/", controller.list);
router.get("/unread-count", controller.unread);
router.post(
  "/mark-read",
  validate({ body: markNotificationsReadSchema }),
  controller.markRead,
);

export default router;
