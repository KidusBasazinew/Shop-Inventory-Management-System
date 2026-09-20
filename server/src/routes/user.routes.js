import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/user.controller.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validations/user.validation.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRole("OWNER", "MANAGER"), controller.list);
router.post(
  "/",
  requireRole("OWNER"),
  validate({ body: createUserSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("OWNER"),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  controller.update,
);
router.delete(
  "/:id",
  requireRole("OWNER"),
  validate({ params: userIdParamSchema }),
  controller.deactivate,
);

export default router;
