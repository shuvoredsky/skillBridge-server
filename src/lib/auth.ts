import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { bearer } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),

    plugins: [bearer()], 
    
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    try {
                        const admins = await prisma.user.findMany({
                            where: { role: "ADMIN" }
                        });
                        for (const admin of admins) {
                            await (prisma as any).notification.create({
                                data: {
                                    receiverId: admin.id,
                                    receiverRole: "ADMIN",
                                    title: "New User Registered",
                                    message: `A new user has registered: ${user.name || user.email} (${user.role}).`,
                                    type: "NEW_USER_REGISTERED",
                                    relatedId: user.id,
                                }
                            });
                        }
                    } catch (err) {
                        console.error("Failed to create registration notification:", err);
                    }
                }
            }
        }
    }, 
    
    trustedOrigins: [
        process.env.APP_URL!,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://skillbridge-server-q.onrender.com", 
    ].filter(Boolean),
    
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    
    user:{
        additionalFields:{
            role:{
                type: "string",
                defaultValue:"STUDENT",
                required: false
            },
            phone:{
                type:"string",
                required: false
            },
        }
    },

    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
    },

    socialProviders: {
        google: { 
            prompt: "select_account consent",
            accessType: "offline",
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
    
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
        cookie: {
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
        },
    },
});