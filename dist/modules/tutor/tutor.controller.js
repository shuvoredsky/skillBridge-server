"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorController = void 0;
const tutor_service_1 = require("./tutor.service");
const createTutorProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await tutor_service_1.TutorService.createTutorProfile(user.id, req.body);
        res.status(201).json({
            message: "Tutor profile create successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const getAllTutors = async (req, res, next) => {
    try {
        const { search, subject, minPrice, maxPrice, minRating } = req.query;
        const filters = {
            search: search,
            subject: subject,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minRating: minRating ? Number(minRating) : undefined,
        };
        const result = await tutor_service_1.TutorService.getAllTutors(filters);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const getMyTutorProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await tutor_service_1.TutorService.getMyTutorProfile(user.id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const updateTutorProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await tutor_service_1.TutorService.updateTutorProfile(user.id, req.body);
        res.status(200).json({
            message: "Tutor profile updated successfully",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
const getTutorById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await tutor_service_1.TutorService.getTutorById(id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.TutorController = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile
};
