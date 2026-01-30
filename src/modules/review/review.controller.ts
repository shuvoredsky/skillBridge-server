import { NextFunction, Request, Response } from "express";
import { ReviewService } from "./review.service";

const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await ReviewService.createReview(user.id, req.body);

    res.status(201).json({
      message: "Review created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTutorReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tutorId } = req.params;

    const result = await ReviewService.getTutorReviews(tutorId as string);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (
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

    const result = await ReviewService.updateReview(id as string, user.id, req.body);

    res.status(200).json({
      message: "Review updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (
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

    const result = await ReviewService.deleteReview(id as string, user.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const ReviewController = {
  createReview,
  getTutorReviews,
  updateReview,
  deleteReview,
};