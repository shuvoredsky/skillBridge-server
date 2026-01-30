import { NextFunction, Request, Response } from "express";
import { BookingService } from "./booking.service";
import { prisma } from "../../lib/prisma";

const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await BookingService.createBooking(user.id, req.body);

    res.status(201).json({
      message: "Booking created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await BookingService.getMyBookings(user.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


const getTutorSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const result = await BookingService.getTutorSessions(tutorProfile.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


const updateBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const result = await BookingService.updateBookingsStatus(
      id as string,
      tutorProfile.id,
      status
    );

    res.status(200).json({
      message: "Booking status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Cancel Booking
const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await BookingService.cancleBooking(id as string, user.id, user.role);

    res.status(200).json({
      message: "Booking cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const BookingController = {
  createBooking,
  getMyBookings,
  getTutorSessions,
  updateBookingStatus,
  cancelBooking,
};