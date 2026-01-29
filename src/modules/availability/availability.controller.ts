import { NextFunction, Request, Response } from "express";
import { AvailabilityService } from "./availability.service";

const createAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    try{
        const user = req.user;

        if(!user || !user.tutorProfile?.id){
            return res.status(403).json({message: "Only tutors can set availability"})
        }

        const result = await AvailabilityService.createAvailability(
            user.tutorProfile.id,
            req.body
        )

        res.status(200).json({
            message: "Availabilty created successfully",
            data: result,
        })
    }catch(error){
        next(error)
    }

}


const updateAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    try{
        const user = req.user;
        const {id} = req.params;

        if(!user || !user.tutorProfile?.id){
            return res.status(403).json({message: "Unauthorized"})
        }

        const result = await AvailabilityService.updateAvailability(
            id as string,
            user.tutorProfile.id,
            req.body
        );

        res.status(200).json({
            message: "Availability updated successfully",
            data: result
        })
    }catch(error){
        next(error)
    }

}


const deleteAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    try{
        const user =  req.user;
        const {id} = req.params;

        if(!user || !user.tutorProfile?.id){
            return res.status(403).json({message: "Unauthorized"});
        }

        await AvailabilityService.deleteAvailability(id, user,tutorProfile.id);

        res.status(200).json({
            message: "Availability deleted successfully"
        })
    }catch(error){
        next(error)
    }

}


const getTutorAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
) =>{

    try{
        const {tutorId} = req.params;
    const result = await AvailabilityService.getTutorAvailability(tutorId);

    res.status(200).json(result)
    }catch(error){
        next(error)
    }

}


export const AvailabilityController = {
    createAvailability,
    updateAvailability,
    deleteAvailability,
    getTutorAvailability
}