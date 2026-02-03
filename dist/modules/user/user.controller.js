"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../user/user.service");
const getMe = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const result = await user_service_1.UserService.getMe(user.id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.UserController = {
    getMe
};
