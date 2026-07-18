import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { WishlistController } from "./wishlist.controller";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.STUDENT),
  WishlistController.getWishlist
);

router.post(
  "/:tutorId",
  auth(UserRole.STUDENT),
  WishlistController.addToWishlist
);

router.delete(
  "/:tutorId",
  auth(UserRole.STUDENT),
  WishlistController.removeFromWishlist
);

export const wishlistRouter = router;
