import { NextFunction, Request, Response } from "express";
import { AdminService } from "./admin.service";

const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, role, status, page, limit } = req.query;

    const filters = {
      search: search as string,
      role: role as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };

    const result = await AdminService.getAllUsers(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "BANNED"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be ACTIVE or BANNED" 
      });
    }

    const result = await AdminService.updateUserStatus(id as string, status);

    res.status(200).json({
      message: `User ${status.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, studentId, tutorId, page, limit } = req.query;

    const filters = {
      status: status as string,
      studentId: studentId as string,
      tutorId: tutorId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };

    const result = await AdminService.getAllBookings(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AdminService.getDashboardStats();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPendingTutors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const filters = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    const result = await AdminService.getPendingTutors(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const approveTutor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await AdminService.approveTutor(id);
    res.status(200).json({
      message: "Tutor profile approved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const rejectTutor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const result = await AdminService.rejectTutor(id, rejectionReason);
    res.status(200).json({
      message: "Tutor profile rejected successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getUserGrowth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const range = parseInt(req.query.range as string) || 30;
    const granularity = (req.query.granularity as "day" | "week" | "month") || "day";
    const result = await AdminService.getUserGrowth(range, granularity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRevenueTrend = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const range = parseInt(req.query.range as string) || 30;
    const granularity = (req.query.granularity as "day" | "week" | "month") || "day";
    const result = await AdminService.getRevenueTrend(range, granularity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getBookingVolume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const range = parseInt(req.query.range as string) || 30;
    const granularity = (req.query.granularity as "day" | "week" | "month") || "day";
    const result = await AdminService.getBookingVolume(range, granularity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTopSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AdminService.getTopSubjects();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTopTutors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const minReviews = parseInt(req.query.minReviews as string) || 3;
    const result = await AdminService.getTopTutors(minReviews);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getDashboardStats,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  getUserGrowth,
  getRevenueTrend,
  getBookingVolume,
  getTopSubjects,
  getTopTutors,
};