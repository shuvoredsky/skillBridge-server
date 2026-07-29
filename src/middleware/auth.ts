import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../lib/auth"
import { UserService } from "../modules/user/user.service";

export enum UserRole {
  STUDENT = "STUDENT",
  TUTOR = "TUTOR",
  ADMIN = "ADMIN"
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
      }
    }
  }
}

const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {

      const session = await betterAuth.api.getSession({
  headers: new Headers(req.headers as Record<string, string>),
});

      console.log("🔐 Auth Check:", {
        hasSession: !!session,
        headers: req.headers.cookie ? "Cookie present" : "No cookie",
        origin: req.headers.origin,
      });

      if (!session) {
        console.log("❌ No session found");
        return res.status(401).json({
          message: "Unauthorized - No valid session"
        });
      }

      // ✅ Additional validation
      if (!session.user) {
        console.log("❌ Session exists but no user");
        return res.status(401).json({
          message: "Unauthorized - Invalid session"
        });
      }

      // Fresh status check to lock out BANNED users promptly
      const dbUser = await UserService.getUserById(session.user.id);
      if (!dbUser || dbUser.status === "BANNED") {
        console.log("❌ Authentication failed: User is banned or does not exist");
        return res.status(403).json({
          message: "Forbidden - Your account has been suspended"
        });
      }

      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as string,
        emailVerified: session.user.emailVerified
      };

      console.log("✅ User authenticated:", req.user.email, req.user.role);

      if (roles.length && !roles.includes(req.user.role as UserRole)) {
        console.log("❌ Forbidden:", req.user.role, "not in", roles);
        return res.status(403).json({
          message: "Forbidden: you don't have permission to access this resource"
        });
      }

      next();
    } catch (error) {
      console.error("❌ Auth error:", error);
      return res.status(401).json({
        message: "Authentication error",
        error: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  }
}

export default auth;