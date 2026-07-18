import { NextFunction, Request, Response } from "express";
import { StatsService } from "./stats.service";

const getPlatformStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await StatsService.getPlatformStats();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const StatsController = {
  getPlatformStats,
};
