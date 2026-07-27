import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from 'cors';
import cookieParser from 'cookie-parser'; // ✅ ADD THIS
import errorHandler from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import { userRouter } from "./modules/user/user.route";
import { tutorRouter } from "./modules/tutor/tutor.route";
import { categoryRouter } from "./modules/category/category.route";
import { availabilityRouter } from "./modules/availability/availability.route";
import { bookingRouter } from "./modules/booking/booking.route";
import { reviewRouter } from "./modules/review/review.route";
import { adminRouter } from "./modules/admin/admin.route";
import { statsRouter } from "./modules/stats/stats.route";
import { wishlistRouter } from "./modules/wishlist/wishlist.route";
import { notificationRouter } from "./modules/notification/notification.route";
import { uploadSingle } from "./config/multer";
import { TutorController } from "./modules/tutor/tutor.controller";
import { UserController } from "./modules/user/user.controller";

const app = express();

app.set('trust proxy', 1);

const getCleanOrigins = () => {
    const rawOrigins = [
        process.env.APP_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://skill-bridge-client-zeta.vercel.app",
    ];
    return rawOrigins
        .filter(Boolean)
        .map((origin) => origin!.replace(/\/$/, "").trim());
};

const allowedOrigins = getCleanOrigins();

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "").trim();
        if (allowedOrigins.includes(cleanOrigin)) {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked:', origin, 'Allowed:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());
app.use(cookieParser()); // ✅ ADD THIS - Very Important!

// ✅ Debugging middleware (remove after fixing)
app.use((req, res, next) => {
    console.log('📥 Request:', {
        method: req.method,
        url: req.url,
        origin: req.headers.origin,
        hasCookie: !!req.headers.cookie,
        cookies: req.cookies, // Now this will work
    });
    next();
});

// Direct endpoints for tutor and student photo upload (Backend Only)
app.post("/api/tutors/:id/upload-photo", uploadSingle("tutors", "photo"), TutorController.uploadPhoto);
app.post("/api/students/:id/upload-photo", uploadSingle("students", "photo"), UserController.uploadPhoto);
app.post("/api/tutors/:id/documents/:type", uploadSingle("certificates", "document"), TutorController.uploadDocument);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tutors", tutorRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/notifications", notificationRouter);

app.get("/", (req, res) => {
  res.send("SkillBridge API is running");
});

app.use(notFound);
app.use(errorHandler);

export default app;