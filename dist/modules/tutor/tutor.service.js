"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorService = void 0;
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const createTutorProfile = async (userId, payload) => {
    const user = await prisma_1.prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });
    const existingProfile = await prisma_1.prisma.tutorProfile.findUnique({
        where: { userId },
    });
    if (existingProfile) {
        throw new Error("Tutor profile already exists");
    }
    const tutorProfile = await prisma_1.prisma.$transaction(async (tx) => {
        const profile = await tx.tutorProfile.create({
            data: {
                userId,
                ...payload,
            },
        });
        await tx.user.update({
            where: { id: userId },
            data: {
                role: auth_1.UserRole.TUTOR,
            },
        });
        return profile;
    });
    return tutorProfile;
};
const getAllTutors = async (filters) => {
    const where = {};
    if (filters.search) {
        where.user = {
            name: {
                contains: filters.search,
                mode: 'insensitive'
            }
        };
    }
    if (filters.subject) {
        where.subjects = {
            has: filters.subject
        };
    }
    if (filters.minPrice || filters.maxPrice) {
        where.hourlyRate = {};
        if (filters.minPrice)
            where.hourlyRate.gte = filters.minPrice;
        if (filters.maxPrice)
            where.hourlyRate.lte = filters.maxPrice;
    }
    if (filters.minRating) {
        where.rating = {
            gte: filters.minRating
        };
    }
    return prisma_1.prisma.tutorProfile.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            }
        },
        orderBy: {
            rating: "desc"
        }
    });
};
const getMyTutorProfile = async (userId) => {
    return prisma_1.prisma.tutorProfile.findFirstOrThrow({
        where: { userId },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });
};
const updateTutorProfile = async (userId, payload) => {
    const profile = await prisma_1.prisma.tutorProfile.findUniqueOrThrow({
        where: { userId }
    });
    return prisma_1.prisma.tutorProfile.update({
        where: { id: profile.id },
        data: payload
    });
};
const getTutorById = async (tutorId) => {
    return prisma_1.prisma.tutorProfile.findUniqueOrThrow({
        where: { id: tutorId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            },
            reviews: {
                include: {
                    student: {
                        select: {
                            name: true,
                            image: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 10
            }
        }
    });
};
exports.TutorService = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile
};
