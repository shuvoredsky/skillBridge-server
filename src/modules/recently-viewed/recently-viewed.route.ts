import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { RecentlyViewedController } from "./recently-viewed.controller";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.STUDENT),
  RecentlyViewedController.getRecentlyViewed
);

router.post(
  "/:tutorId",
  auth(UserRole.STUDENT),
  RecentlyViewedController.recordView
);

export const recentlyViewedRouter = router;
