import { NextFunction, Request, Response } from "express";
import { TutorService } from "./tutor.service";

const createTutorProfile = async(
    req: Request,
    res: Response,
    next: NextFunction
)=>{
    try {
        const user = req.user;

        if(!user){
            return res.status(401).json({message: "Unauthorized"})
        }

        const result = await TutorService.createTutorProfile(user.id, req.body)

        res.status(201).json({
            message: "Tutor profile create successfully",
            data: result,
        })

    } catch(error){
        next(error)
    }
}


const getAllTutors = async (req: Request, res:Response, next: NextFunction) =>{
    try {
        const result = await TutorService.getAllTutors()
        res.status(200).json(result)
    }catch(error){
        next(error)
    }
}


const getMyTutorProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
)=>{
    try {
        const user = req.user;

        if(!user){
            return res.status(401).json({message: "Unauthorized"})
        }

        const result = await TutorService.getMyTutorProfile(user.id);
        res.status(200).json(result)
    }catch(error){
        next(error)
    }
}

export const TutorController = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile
}
