import { NextFunction, Request, Response } from "express";
import { WishlistService } from "./wishlist.service";

const addToWishlist = async (
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
    const result = await WishlistService.addToWishlist(user.id, tutorId);
    res.status(201).json({
      message: "Tutor added to wishlist successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Something went wrong" });
  }
};

const removeFromWishlist = async (
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
    await WishlistService.removeFromWishlist(user.id, tutorId);
    res.status(200).json({
      message: "Tutor removed from wishlist successfully",
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Something went wrong" });
  }
};

const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await WishlistService.getWishlist(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const WishlistController = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
