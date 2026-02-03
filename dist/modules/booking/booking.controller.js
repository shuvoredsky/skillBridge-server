"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("./booking.service");
const prisma_1 = require("../../lib/prisma");
const createBooking = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await booking_service_1.BookingService.createBooking(user.id, req.body);
        res.status(201).json({
            message: "Booking created successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const getMyBookings = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await booking_service_1.BookingService.getMyBookings(user.id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const getTutorSessions = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const tutorProfile = await prisma_1.prisma.tutorProfile.findUnique({
            where: { userId: user.id },
        });
        if (!tutorProfile) {
            return res.status(404).json({ message: "Tutor profile not found" });
        }
        const result = await booking_service_1.BookingService.getTutorSessions(tutorProfile.id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const updateBookingStatus = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status } = req.body;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const tutorProfile = await prisma_1.prisma.tutorProfile.findUnique({
            where: { userId: user.id },
        });
        if (!tutorProfile) {
            return res.status(404).json({ message: "Tutor profile not found" });
        }
        const result = await booking_service_1.BookingService.updateBookingsStatus(id, tutorProfile.id, status);
        res.status(200).json({
            message: "Booking status updated successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
// ✅ Cancel Booking
const cancelBooking = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await booking_service_1.BookingService.cancleBooking(id, user.id, user.role);
        res.status(200).json({
            message: "Booking cancelled successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.BookingController = {
    createBooking,
    getMyBookings,
    getTutorSessions,
    updateBookingStatus,
    cancelBooking,
};
