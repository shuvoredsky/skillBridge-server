import { NextFunction, Request, Response } from "express";
import { AdminService } from "./admin.service";

const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, role, status } = req.query;

    const filters = {
      search: search as string,
      role: role as string,
      status: status as string,
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
    const { status, studentId, tutorId } = req.query;

    const filters = {
      status: status as string,
      studentId: studentId as string,
      tutorId: tutorId as string,
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

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getDashboardStats,
};