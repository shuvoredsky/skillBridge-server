import { NextFunction, Request, Response } from "express";
import { RecentlyViewedService } from "./recently-viewed.service";

const recordView = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { tutorId } = req.params;
    const result = await RecentlyViewedService.recordView(user.id, tutorId);
    res.status(201).json({
      message: "Tutor view recorded successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Something went wrong" });
  }
};

const getRecentlyViewed = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await RecentlyViewedService.getRecentlyViewed(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const RecentlyViewedController = {
  recordView,
  getRecentlyViewed,
};
