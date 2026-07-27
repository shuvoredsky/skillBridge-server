import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { AdminController } from "./admin.controller";

const router = express.Router();

router.get("/users", auth(UserRole.ADMIN), AdminController.getAllUsers);


router.patch(
  "/users/:id/status",
  auth(UserRole.ADMIN),
  AdminController.updateUserStatus
);


router.get("/bookings", auth(UserRole.ADMIN), AdminController.getAllBookings);

router.get("/stats", auth(UserRole.ADMIN), AdminController.getDashboardStats);

router.get("/tutors/pending", auth(UserRole.ADMIN), AdminController.getPendingTutors);

router.patch("/tutors/:id/approve", auth(UserRole.ADMIN), AdminController.approveTutor);

router.patch("/tutors/:id/reject", auth(UserRole.ADMIN), AdminController.rejectTutor);

router.get("/analytics/user-growth", auth(UserRole.ADMIN), AdminController.getUserGrowth);

router.get("/analytics/revenue", auth(UserRole.ADMIN), AdminController.getRevenueTrend);

router.get("/analytics/booking-volume", auth(UserRole.ADMIN), AdminController.getBookingVolume);

router.get("/analytics/top-subjects", auth(UserRole.ADMIN), AdminController.getTopSubjects);

router.get("/analytics/top-tutors", auth(UserRole.ADMIN), AdminController.getTopTutors);

export const adminRouter = router;