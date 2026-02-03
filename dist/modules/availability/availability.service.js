"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const prisma_1 = require("../../lib/prisma");
const createAvailability = async (tutorId, payload) => {
    const today = new Date().toISOString().split('T')[0];
    return prisma_1.prisma.availability.create({
        data: {
            tutorId,
            dayOfWeek: payload.dayOfWeek,
            startTime: new Date(`${today}T${payload.startTime}:00Z`),
            endTime: new Date(`${today}T${payload.endTime}:00Z`),
        }
    });
};
const updateAvailability = async (availabilityId, tutorId, payload) => {
    const availability = await prisma_1.prisma.availability.findUniqueOrThrow({
        where: { id: availabilityId }
    });
    if (availability.tutorId !== tutorId) {
        throw new Error("you are not allowed to update this availability");
    }
    return prisma_1.prisma.availability.update({
        where: { id: availabilityId },
        data: payload,
    });
};
const deleteAvailability = async (availabilityId, tutorId) => {
    const availability = await prisma_1.prisma.availability.findUniqueOrThrow({
        where: { id: availabilityId },
    });
    if (availability.tutorId !== tutorId) {
        throw new Error("You are not allowed to delete this availability");
    }
    return prisma_1.prisma.availability.delete({
        where: { id: availabilityId }
    });
};
const getTutorAvailability = async (tutorId) => {
    return prisma_1.prisma.availability.findMany({
        where: { tutorId },
        orderBy: { dayOfWeek: "asc" }
    });
};
exports.AvailabilityService = {
    createAvailability,
    updateAvailability,
    deleteAvailability,
    getTutorAvailability
};
