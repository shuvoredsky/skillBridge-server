"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const getAllUsers = async (req, res, next) => {
    try {
        const { search, role, status } = req.query;
        const filters = {
            search: search,
            role: role,
            status: status,
        };
        const result = await admin_service_1.AdminService.getAllUsers(filters);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["ACTIVE", "BANNED"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be ACTIVE or BANNED"
            });
        }
        const result = await admin_service_1.AdminService.updateUserStatus(id, status);
        res.status(200).json({
            message: `User ${status.toLowerCase()} successfully`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
const getAllBookings = async (req, res, next) => {
    try {
        const { status, studentId, tutorId } = req.query;
        const filters = {
            status: status,
            studentId: studentId,
            tutorId: tutorId,
        };
        const result = await admin_service_1.AdminService.getAllBookings(filters);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const getDashboardStats = async (req, res, next) => {
    try {
        const result = await admin_service_1.AdminService.getDashboardStats();
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.AdminController = {
    getAllUsers,
    updateUserStatus,
    getAllBookings,
    getDashboardStats,
};
