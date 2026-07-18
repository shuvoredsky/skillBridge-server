import express from "express";
import auth from "../../middleware/auth";
import { NotificationController } from "./notification.controller";

const router = express.Router();

router.get(
  "/",
  auth(),
  NotificationController.getNotifications
);

router.get(
  "/unread-count",
  auth(),
  NotificationController.getUnreadCount
);

router.patch(
  "/mark-all-read",
  auth(),
  NotificationController.markAllRead
);

export const notificationRouter = router;
