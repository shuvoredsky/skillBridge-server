"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const availability_service_1 = require("./availability.service");
const prisma_1 = require("../../lib/prisma");
const createAvailability = async (req, res, next) => {
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
        const result = await availability_service_1.AvailabilityService.createAvailability(tutorProfile.id, req.body);
        res.status(201).json({
            message: "Availability created successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const updateAvailability = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || user.role !== "TUTOR") {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const tutorProfile = await prisma_1.prisma.tutorProfile.findUnique({
            where: { userId: user.id },
        });
        if (!tutorProfile) {
            return res.status(404).json({ message: "Tutor profile not found" });
        }
        const result = await availability_service_1.AvailabilityService.updateAvailability(id, tutorProfile.id, req.body);
        res.status(200).json({
            message: "Availability updated successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const deleteAvailability = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || user.role !== "TUTOR") {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const tutorProfile = await prisma_1.prisma.tutorProfile.findUnique({
            where: { userId: user.id },
        });
        if (!tutorProfile) {
            return res.status(404).json({ message: "Tutor profile not found" });
        }
        await availability_service_1.AvailabilityService.deleteAvailability(id, tutorProfile.id);
        res.status(200).json({
            message: "Availability deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
const getTutorAvailability = async (req, res, next) => {
    try {
        const { tutorId } = req.params;
        const result = await availability_service_1.AvailabilityService.getTutorAvailability(tutorId);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.AvailabilityController = {
    createAvailability,
    updateAvailability,
    deleteAvailability,
    getTutorAvailability,
};
