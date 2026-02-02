import express from "express";
import { TutorController } from "./tutor.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = express.Router();


router.get("/", TutorController.getAllTutors);

router.post(
  "/profile",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  TutorController.createTutorProfile
);

router.put(
  "/profile",
  auth(UserRole.TUTOR, UserRole.ADMIN),
  TutorController.updateTutorProfile
);

router.get(
  "/profile/me", 
  auth(UserRole.TUTOR, UserRole.ADMIN),
  TutorController.getMyTutorProfile
);


router.get("/:id", TutorController.getTutorById);

export const tutorRouter = router;