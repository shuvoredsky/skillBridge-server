"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const prisma_1 = require("../../lib/prisma");
const createReview = async (studentId, payload) => {
    const booking = await prisma_1.prisma.booking.findUniqueOrThrow({
        where: { id: payload.bookingId },
        include: { tutor: true },
    });
    if (booking.studentId !== studentId) {
        throw new Error("You can only review your own bookings");
    }
    if (booking.status !== "COMPLETED") {
        throw new Error("You can only review completed bookings");
    }
    const existingReview = await prisma_1.prisma.review.findUnique({
        where: { bookingId: payload.bookingId },
    });
    if (existingReview) {
        throw new Error("You have already reviewed this booking");
    }
    if (payload.rating < 1 || payload.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
            data: {
                bookingId: payload.bookingId,
                studentId,
                tutorId: booking.tutorId,
                rating: payload.rating,
                comment: payload.comment,
            },
            include: {
                student: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
            },
        });
        const reviews = await tx.review.findMany({
            where: { tutorId: booking.tutorId },
            select: { rating: true },
        });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;
        await tx.tutorProfile.update({
            where: { id: booking.tutorId },
            data: {
                rating: parseFloat(averageRating.toFixed(2)),
                totalReviews: reviews.length,
            },
        });
        return review;
    });
};
const getTutorReviews = async (tutorId) => {
    return prisma_1.prisma.review.findMany({
        where: { tutorId },
        include: {
            student: {
                select: {
                    name: true,
                    image: true,
                },
            },
            booking: {
                select: {
                    subject: true,
                    date: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
const updateReview = async (reviewId, studentId, payload) => {
    const review = await prisma_1.prisma.review.findUniqueOrThrow({
        where: { id: reviewId },
        include: { booking: true },
    });
    if (review.studentId !== studentId) {
        throw new Error("You can only update your own reviews");
    }
    if (payload.rating && (payload.rating < 1 || payload.rating > 5)) {
        throw new Error("Rating must be between 1 and 5");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updatedReview = await tx.review.update({
            where: { id: reviewId },
            data: payload,
        });
        const reviews = await tx.review.findMany({
            where: { tutorId: review.tutorId },
            select: { rating: true },
        });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;
        await tx.tutorProfile.update({
            where: { id: review.tutorId },
            data: {
                rating: parseFloat(averageRating.toFixed(2)),
            },
        });
        return updatedReview;
    });
};
const deleteReview = async (reviewId, studentId) => {
    const review = await prisma_1.prisma.review.findUniqueOrThrow({
        where: { id: reviewId },
    });
    if (review.studentId !== studentId) {
        throw new Error("You can only delete your own reviews");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.review.delete({
            where: { id: reviewId },
        });
        const reviews = await tx.review.findMany({
            where: { tutorId: review.tutorId },
            select: { rating: true },
        });
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        await tx.tutorProfile.update({
            where: { id: review.tutorId },
            data: {
                rating: parseFloat(averageRating.toFixed(2)),
                totalReviews: reviews.length,
            },
        });
        return { message: "Review deleted successfully" };
    });
};
exports.ReviewService = {
    createReview,
    getTutorReviews,
    updateReview,
    deleteReview,
};
