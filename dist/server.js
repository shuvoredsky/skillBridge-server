"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./lib/prisma");
const port = process.env.PORT || 5000;
async function main() {
    try {
        await prisma_1.prisma.$connect();
        console.log("Connected to the database successfully");
        if (process.env.NODE_ENV !== 'production') {
            app_1.default.listen(port, () => {
                console.log(`Server is running on http://localhost:${port}`);
            });
        }
    }
    catch (error) {
        console.error("An error occurred", error);
        await prisma_1.prisma.$disconnect();
    }
}
main();
exports.default = app_1.default;
