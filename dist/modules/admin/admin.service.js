"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const prisma_1 = require("../../lib/prisma");
const getAllUsers = async (filters) => {
    const where = {};
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    if (filters.role) {
        where.role = filters.role;
    }
    if (filters.status) {
        where.status = filters.status;
    }
    return prisma_1.prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            image: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
            tutorProfile: {
                select: {
                    id: true,
                    rating: true,
                    totalReviews: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
const updateUserStatus = async (userId, status) => {
    const user = await prisma_1.prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });
    if (user.role === "ADMIN") {
        throw new Error("Cannot ban admin users");
    }
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: { status },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
};
const getAllBookings = async (filters) => {
    const where = {};
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.studentId) {
        where.studentId = filters.studentId;
    }
    if (filters.tutorId) {
        where.tutorId = filters.tutorId;
    }
    return prisma_1.prisma.booking.findMany({
        where,
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            tutor: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            review: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
const getDashboardStats = async () => {
    const [totalUsers, totalStudents, totalTutors, totalBookings, confirmedBookings, completedBookings, cancelledBookings, totalReviews, totalCategories,] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.user.count({ where: { role: "STUDENT" } }),
        prisma_1.prisma.user.count({ where: { role: "TUTOR" } }),
        prisma_1.prisma.booking.count(),
        prisma_1.prisma.booking.count({ where: { status: "CONFIRMED" } }),
        prisma_1.prisma.booking.count({ where: { status: "COMPLETED" } }),
        prisma_1.prisma.booking.count({ where: { status: "CANCELLED" } }),
        prisma_1.prisma.review.count(),
        prisma_1.prisma.category.count(),
    ]);
    const topTutors = await prisma_1.prisma.tutorProfile.findMany({
        take: 5,
        orderBy: { rating: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });
    const recentBookings = await prisma_1.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
            student: {
                select: { name: true },
            },
            tutor: {
                include: {
                    user: {
                        select: { name: true },
                    },
                },
            },
        },
    });
    return {
        users: {
            total: totalUsers,
            students: totalStudents,
            tutors: totalTutors,
        },
        bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
        },
        reviews: {
            total: totalReviews,
        },
        categories: {
            total: totalCategories,
        },
        topTutors,
        recentBookings,
    };
};
exports.AdminService = {
    getAllUsers,
    updateUserStatus,
    getAllBookings,
    getDashboardStats,
};
