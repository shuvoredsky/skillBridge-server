import { NextFunction, Request, Response } from "express";
import {auth as betterAuth} from "../lib/auth"
import { UserService } from "../modules/user/user.service";
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
        emailVerified: boolean;
      }
    }
  }
}

const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await betterAuth.api.getSession({
        headers: req.headers as any
      })
      
      
      if (!session) {
        return res.status(401).json({ message: "Unauthorized" })
      }

      if(!session.user.emailVerified){
        return res.status(403).json({ message: "Email veryfiaction required, please verify your email" })
      }

      const dbUser = await UserService.createUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.emailVerified
      })
      
      req.user={
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified
      }

      if(roles.length && !roles.includes(req.user.role as UserRole)){
        return res.status(403).json({ message: "Forbidden: you don't have permission to access this resources" })
      }
      


      
      next() 
    } catch (error) {
        next(error)
      console.error(error)
      res.status(500).json({ message: "Server error" })
    }
  }
}

export default auth;