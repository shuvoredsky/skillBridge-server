"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const review_service_1 = require("./review.service");
const createReview = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await review_service_1.ReviewService.createReview(user.id, req.body);
        res.status(201).json({
            message: "Review created successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const getTutorReviews = async (req, res, next) => {
    try {
        const { tutorId } = req.params;
        const result = await review_service_1.ReviewService.getTutorReviews(tutorId);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const updateReview = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await review_service_1.ReviewService.updateReview(id, user.id, req.body);
        res.status(200).json({
            message: "Review updated successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const deleteReview = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await review_service_1.ReviewService.deleteReview(id, user.id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.ReviewController = {
    createReview,
    getTutorReviews,
    updateReview,
    deleteReview,
};
