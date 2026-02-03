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


const allowedOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  process.env.PROD_APP_URL, 
].filter(Boolean); 

app.use(
  cors({
    origin: (origin, callback) => {
      
      if (!origin) return callback(null, true);

      
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin); 

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

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