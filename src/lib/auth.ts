import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    trustedOrigins:[process.env.APP_URL!],
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
        autoSignIn: true,  // ✅ Changed from false to true
        requireEmailVerification: false,  // ✅ Changed from true to false
        account: {
            type: "credentials",   
        },
    },

    // ✅ Remove entire emailVerification block
    // emailVerification: { ... } ← Delete this entire section

    socialProviders: {
        google: { 
            prompt: "select_account consent",
            accessType: "offline",
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
});