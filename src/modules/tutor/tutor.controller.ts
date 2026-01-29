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


const getAllTutors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, subject, minPrice, maxPrice, minRating } = req.query;

    const filters = {
      search: search as string,
      subject: subject as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
    };

    const result = await TutorService.getAllTutors(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


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


const updateTutorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await TutorService.updateTutorProfile(user.id, req.body);
    res.status(200).json({
      message: "Tutor profile updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getTutorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await TutorService.getTutorById(id as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const TutorController = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile
}
