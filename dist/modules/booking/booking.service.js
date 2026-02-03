"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const prisma_1 = require("../../lib/prisma");
const createBooking = async (studentId, payload) => {
    const tutorProfile = await prisma_1.prisma.tutorProfile.findUnique({
        where: { id: payload.tutorId },
    });
    if (!tutorProfile) {
        throw new Error("Tutor profile not found");
    }
    const bookingDate = new Date(`${payload.date}T00:00:00Z`);
    const startDateTime = new Date(`${payload.date}T${payload.startTime}:00Z`);
    const endDateTime = new Date(`${payload.date}T${payload.endTime}:00Z`);
    const existingBooking = await prisma_1.prisma.booking.findFirst({
        where: {
            tutorId: payload.tutorId,
            date: bookingDate,
            startTime: startDateTime,
            status: {
                in: ["CONFIRMED", "COMPLETED"]
            }
        }
    });
    if (existingBooking) {
        throw new Error("This time slot is already booked");
    }
    return prisma_1.prisma.booking.create({
        data: {
            studentId,
            tutorId: payload.tutorId,
            date: bookingDate,
            startTime: startDateTime,
            endTime: endDateTime,
            subject: payload.subject,
            notes: payload.notes || "",
            status: "CONFIRMED",
        },
        include: {
            tutor: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });
};
const getMyBookings = async (studentId) => {
    return prisma_1.prisma.booking.findMany({
        where: { studentId },
        include: {
            tutor: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                }
            },
            review: true,
        },
        orderBy: {
            date: "desc"
        }
    });
};
const getTutorSessions = async (tutorId) => {
    return prisma_1.prisma.booking.findMany({
        where: { tutorId },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                }
            },
            review: true,
        },
        orderBy: {
            date: "desc"
        }
    });
};
const updateBookingsStatus = async (bookingId, tutorId, status) => {
    const booking = await prisma_1.prisma.booking.findFirstOrThrow({
        where: { id: bookingId },
    });
    if (booking.tutorId !== tutorId) {
        throw new Error("You are not authorized to update this booking");
    }
    return prisma_1.prisma.booking.update({
        where: { id: bookingId },
        data: { status }
    });
};
const cancleBooking = async (bookingId, userId, userRole) => {
    const booking = await prisma_1.prisma.booking.findFirstOrThrow({
        where: { id: bookingId },
        include: {
            tutor: true,
        }
    });
    if (booking.status === "COMPLETED") {
        throw new Error("Cannot cancel a completed booking");
    }
    return prisma_1.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
    });
};
exports.BookingService = {
    createBooking,
    getMyBookings,
    getTutorSessions,
    updateBookingsStatus,
    cancleBooking
};
