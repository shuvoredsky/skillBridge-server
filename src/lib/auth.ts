import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    
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