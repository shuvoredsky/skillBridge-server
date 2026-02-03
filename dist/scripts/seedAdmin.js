"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
async function seedAdmin() {
    try {
        console.log('*******Admin started*********');
        const adminData = {
            name: "Admin shuvo",
            email: "admin@admin.com",
            role: auth_1.UserRole.ADMIN,
            password: "admin1234"
        };
        console.log('*******Checking admin exist or not*********');
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: {
                email: adminData.email
            }
        });
        if (existingUser) {
            throw new Error("User alrady exists in db");
        }
        const signUpAdmin = await fetch("http://localhost:5000/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": 'application/json',
                "Origin": "http://localhost:3000"
            },
            body: JSON.stringify(adminData)
        });
        if (signUpAdmin.ok) {
            console.log("****ADMIN Creted*****");
            await prisma_1.prisma.user.update({
                where: {
                    email: adminData.email
                },
                data: {
                    emailVerified: true
                }
            });
            console.log("****Email verification updated*****");
        }
        console.log("***Success***");
    }
    catch (error) {
        console.error(error);
    }
}
seedAdmin();
