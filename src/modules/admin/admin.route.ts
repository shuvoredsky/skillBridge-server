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

export const adminRouter = router;