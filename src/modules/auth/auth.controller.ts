import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    console.log("🔍 Received verification request");
    console.log("📧 Token:", token);

    if (!token) {
      console.log("❌ No token provided");
      return res.status(400).json({ message: "Token is required" });
    }

    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    console.log("🔎 Verification record:", verification);

    if (!verification) {
      console.log("❌ Invalid or expired token");
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    const userEmail = verification.identifier;

    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { emailVerified: true },
    });

    console.log("✅ User email verified:", user.email);

    await prisma.verification.delete({
      where: { id: verification.id },
    });

    console.log("🗑️ Verification token deleted");

    res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    console.error("💥 Verification error:", error);
    res.status(500).json({
      message: error.message || "Verification failed",
    });
  }
};