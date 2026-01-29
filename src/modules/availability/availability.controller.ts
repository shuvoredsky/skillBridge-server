import { NextFunction, Request, Response } from "express";
import { AvailabilityService } from "./availability.service";
import { prisma } from "../../lib/prisma";

const createAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user || user.role !== "TUTOR") {
      return res.status(403).json({ message: "Only tutors can set availability" });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const result = await AvailabilityService.createAvailability(
      tutorProfile.id,
      req.body
    );

    res.status(201).json({
      message: "Availability created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.role !== "TUTOR") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const result = await AvailabilityService.updateAvailability(
      id as string,
      tutorProfile.id,
      req.body
    );

    res.status(200).json({
      message: "Availability updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.role !== "TUTOR") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    await AvailabilityService.deleteAvailability(id as string, tutorProfile.id);

    res.status(200).json({
      message: "Availability deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getTutorAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tutorId } = req.params;

    const result = await AvailabilityService.getTutorAvailability(tutorId as string);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const AvailabilityController = {
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getTutorAvailability,
};
