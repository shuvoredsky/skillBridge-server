import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "./prisma";
import nodemailer from "nodemailer"


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


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
            // status:{
            //     type:"string",
            //     defaultValue:"ACTIVE",
            //     required: false
            // }
        }
    },

   emailAndPassword: {
  enabled: true,
  autoSignIn: false,
  requireEmailVerification: true,
  account: {
    type: "credentials",   
  },
},

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification:true,
    sendVerificationEmail: async ( { user, url, token }, request) => {
       try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`
    const info = await transporter.sendMail({
      from: '"Prisma Blog" <prisma@blog.com>', 
      to: user.email, 
      subject: "Plese verify your email", 
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Verify Your Email</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <tr>
              <td style="background-color:#111827; padding:20px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:24px;">
                  Prisma Blog
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <h2 style="margin-top:0; color:#111827;">
                  Verify your email address
                </h2>

                <p style="color:#374151; font-size:16px; line-height:1.6;">
                  Thanks for signing up for <strong>Prisma Blog</strong>!  
                  Please confirm your email address by clicking the button below.
                </p>

                <!-- Button -->
                <div style="text-align:center; margin:30px 0;">
                  <a
                    href="${verificationUrl}"
                    style="
                      background-color:#2563eb;
                      color:#ffffff;
                      padding:12px 24px;
                      text-decoration:none;
                      font-size:16px;
                      border-radius:6px;
                      display:inline-block;
                    "
                  >
                    Verify Email
                  </a>
                </div>

                <p style="color:#6b7280; font-size:14px; line-height:1.6;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>

                <p style="word-break:break-all; font-size:14px; color:#2563eb;">
                  ${verificationUrl}
                </p>

                <p style="color:#6b7280; font-size:14px; line-height:1.6;">
                  If you didn’t create an account, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
                © 2025 Prisma Blog. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
` 
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail", err);
  }
    },
  },

  socialProviders: {
        google: { 
            prompt: "select_account consent",
            accessType: "offline",
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
            
        }, 
    },
});