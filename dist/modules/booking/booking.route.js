"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importStar(require("../../middleware/auth"));
const booking_controller_1 = require("./booking.controller");
const router = express_1.default.Router();
router.post("/", (0, auth_1.default)(auth_1.UserRole.STUDENT), booking_controller_1.BookingController.createBooking);
router.get("/my-bookings", (0, auth_1.default)(auth_1.UserRole.STUDENT), booking_controller_1.BookingController.getMyBookings);
router.get("/my-sessions", (0, auth_1.default)(auth_1.UserRole.TUTOR), booking_controller_1.BookingController.getTutorSessions);
router.patch("/:id/status", (0, auth_1.default)(auth_1.UserRole.TUTOR), booking_controller_1.BookingController.updateBookingStatus);
router.delete("/:id", (0, auth_1.default)(auth_1.UserRole.STUDENT, auth_1.UserRole.TUTOR, auth_1.UserRole.ADMIN), booking_controller_1.BookingController.cancelBooking);
exports.bookingRouter = router;
