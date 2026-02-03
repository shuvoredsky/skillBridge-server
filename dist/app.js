"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_1 = require("better-auth/node");
const auth_1 = require("./lib/auth");
const cors_1 = __importDefault(require("cors"));
const globalErrorHandler_1 = __importDefault(require("./middleware/globalErrorHandler"));
const notFound_1 = require("./middleware/notFound");
const user_route_1 = require("./modules/user/user.route");
const tutor_route_1 = require("./modules/tutor/tutor.route");
const category_route_1 = require("./modules/category/category.route");
const availability_route_1 = require("./modules/availability/availability.route");
const booking_route_1 = require("./modules/booking/booking.route");
const review_route_1 = require("./modules/review/review.route");
const admin_route_1 = require("./modules/admin/admin.route");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json());
app.all('/api/auth/*splat', (0, node_1.toNodeHandler)(auth_1.auth));
app.use("/api/v1/users", user_route_1.userRouter);
app.use("/api/v1/tutors", tutor_route_1.tutorRouter);
app.use("/api/v1/categories", category_route_1.categoryRouter);
app.use("/api/v1/availability", availability_route_1.availabilityRouter);
app.use("/api/v1/bookings", booking_route_1.bookingRouter);
app.use("/api/v1/reviews", review_route_1.reviewRouter);
app.use("/api/v1/admin", admin_route_1.adminRouter);
app.get("/", (req, res) => {
    res.send("SkillBridge API is running");
});
app.use(globalErrorHandler_1.default);
app.use(notFound_1.notFound);
exports.default = app;
