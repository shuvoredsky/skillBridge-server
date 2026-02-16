import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from 'cors';
import cookieParser from 'cookie-parser';
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

app.set('trust proxy', 1);

 

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://skill-bridge-client-zeta.vercel.app", 
  ],
  credentials: true, // ⚠️ Must
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
}));

app.use(express.json());
app.use(cookieParser()); 


app.use((req, res, next) => {
    console.log('📥 Request:', {
        method: req.method,
        url: req.url,
        origin: req.headers.origin,
        hasCookie: !!req.headers.cookie,
        cookies: req.cookies, 
    });
    next();
});

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

app.use(notFound);
app.use(errorHandler);

export default app;