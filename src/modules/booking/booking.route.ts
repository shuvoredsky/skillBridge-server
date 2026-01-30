import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { BookingController } from "./booking.controller";

const router = express.Router();


router.post(
  "/",
  auth(UserRole.STUDENT),
  BookingController.createBooking
);


router.get(
  "/my-bookings",
  auth(UserRole.STUDENT),
  BookingController.getMyBookings
);


router.get(
  "/my-sessions",
  auth(UserRole.TUTOR),
  BookingController.getTutorSessions
);


router.patch(
  "/:id/status",
  auth(UserRole.TUTOR),
  BookingController.updateBookingStatus
);


router.delete(
  "/:id",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  BookingController.cancelBooking
);

export const bookingRouter = router;