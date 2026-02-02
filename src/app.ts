import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from 'cors'
import errorHandler from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";


import { userRouter } from "./modules/user/user.route";
import { tutorRouter } from "./modules/tutor/tutor.route";
import { categoryRouter } from "./modules/category/category.route";
import { availabilityRouter } from "./modules/availability/availability.route";
import { bookingRouter } from "./modules/booking/booking.route";
import { reviewRouter } from "./modules/review/review.route";
import { adminRouter } from "./modules/admin/admin.route";

const app = express();

app.use(cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true
}))
app.use(express.json());

app.all('/api/auth/*splat', toNodeHandler(auth));


app.use("/api/v1/users", userRouter);
app.use("/api/v1/tutors", tutorRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("SkillBridge API is running");
});


app.use(errorHandler)
app.use(notFound)

export default app;