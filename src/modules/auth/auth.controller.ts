import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;
    if (!token) {
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

    if (!verification) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    const userEmail = verification.identifier;

    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { emailVerified: true },
    });

    await prisma.verification.delete({
      where: { id: verification.id },
    });

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