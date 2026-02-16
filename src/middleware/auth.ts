import { NextFunction, Request, Response } from "express";
import {auth as betterAuth} from "../lib/auth"

export enum UserRole{
  STUDENT = "STUDENT",
  TUTOR = "TUTOR",
  ADMIN = "ADMIN"
}

declare global{
  namespace Express {
    interface Request{
      user?:{
        id: string;
        email: string;
        name: string;
        role: string;
      }
    }
  }
}

const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });

      if (!session?.user) {
        return res.status(401).json({ 
          message: "Unauthorized - Please login" 
        });
      }

      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as string,
      };

      if(roles.length && !roles.includes(req.user.role as UserRole)){
        return res.status(403).json({ 
          message: "Forbidden: you don't have permission to access this resource" 
        });
      }

      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ 
        message: "Authentication error"
      });
    }
  }
}

export default auth;