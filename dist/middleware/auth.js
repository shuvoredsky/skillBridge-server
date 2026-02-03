"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const auth_1 = require("../lib/auth");
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "STUDENT";
    UserRole["TUTOR"] = "TUTOR";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
const auth = (...roles) => {
    return async (req, res, next) => {
        try {
            const session = await auth_1.auth.api.getSession({
                headers: req.headers
            });
            if (!session) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!session.user.emailVerified) {
                return res.status(403).json({ message: "Email veryfiaction required, please verify your email" });
            }
            req.user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role,
                emailVerified: session.user.emailVerified
            };
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: "Forbidden: you don't have permission to access this resources" });
            }
            next();
        }
        catch (error) {
            next(error);
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    };
};
exports.default = auth;
