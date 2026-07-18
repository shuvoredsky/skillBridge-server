import { NextFunction, Request, Response } from "express";
import { TutorService } from "./tutor.service";
import fs from "fs";
import path from "path";

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

const uploadPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or file type is invalid." });
    }

    // 1. Verify tutor profile exists
    const tutorProfile = await TutorService.getTutorProfileOnly(id);
    if (!tutorProfile) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        await fs.promises.unlink(req.file.path).catch(err => console.error("Error deleting uploaded file on invalid tutor ID:", err));
      }
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // 2. Delete old photo if it exists on disk
    if (tutorProfile.profilePhoto) {
      const oldPath = path.join(process.cwd(), tutorProfile.profilePhoto);
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath).catch(err => console.error("Failed to delete old tutor photo:", err));
      }
    }

    // 3. Save new path relative to project root
    const relativePath = `/uploads/tutors/${req.file.filename}`;
    await TutorService.updateTutorProfilePhoto(id, relativePath);

    const photoUrl = `${req.protocol}://${req.get("host")}${relativePath}`;

    res.status(200).json({
      message: "Tutor profile photo uploaded successfully",
      profilePhoto: relativePath,
      profilePhotoUrl: photoUrl
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path).catch(err => console.error("Error deleting uploaded file on error:", err));
    }
    next(error);
  }
};

export const TutorController = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile,
    uploadPhoto
}
