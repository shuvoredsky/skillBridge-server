import { NextFunction, Request, Response } from "express";
import { NotificationService } from "./notification.service";

const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await NotificationService.getNotifications(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const count = await NotificationService.getUnreadCount(user.id);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await NotificationService.markAllRead(user.id);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

export const NotificationController = {
  getNotifications,
  getUnreadCount,
  markAllRead,
};
