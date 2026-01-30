import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { ReviewController } from "./review.controller";

const router = express.Router();


router.post("/", auth(UserRole.STUDENT), ReviewController.createReview);

router.get("/tutor/:tutorId", ReviewController.getTutorReviews);


router.put("/:id", auth(UserRole.STUDENT), ReviewController.updateReview);

router.delete("/:id", auth(UserRole.STUDENT), ReviewController.deleteReview);

export const reviewRouter = router;