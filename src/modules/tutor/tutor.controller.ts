import { NextFunction, Request, Response } from "express";
import { TutorService } from "./tutor.service";
import { uploadToCloudinary, deleteFromCloudinary } from "../../lib/cloudinary";
import { TutorDocumentType } from "@prisma/client";

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
    const { search, subject, minPrice, maxPrice, minRating, page, limit } = req.query;

    const filters = {
      search: search as string,
      subject: subject as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
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
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // 2. Delete old photo if it exists on Cloudinary, otherwise skip for local files
    if (tutorProfile.profilePhotoPublicId) {
      await deleteFromCloudinary(tutorProfile.profilePhotoPublicId);
    } else if (tutorProfile.profilePhoto) {
      console.log(`Skipping Cloudinary deletion for pre-migration local photo path: ${tutorProfile.profilePhoto}`);
    }

    // 3. Upload to Cloudinary
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const publicId = `tutor_${sanitizedId}`;

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/tutors/profile-photos",
      publicId,
      true
    );

    // 4. Save secure URL and public ID
    await TutorService.updateTutorProfilePhoto(id, uploadResult.secure_url, uploadResult.public_id);

    res.status(200).json({
      message: "Tutor profile photo uploaded successfully",
      profilePhoto: uploadResult.secure_url,
      profilePhotoUrl: uploadResult.secure_url
    });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, type } = req.params;

    if (!type || !["degree", "nid", "certificate"].includes(type.toLowerCase())) {
      return res.status(400).json({ message: "Invalid document type. Must be degree, nid, or certificate" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or file type is invalid." });
    }

    // 1. Verify tutor profile exists
    const tutorProfile = await TutorService.getTutorProfileOnly(id);
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const docTypeEnum = type.toUpperCase() as TutorDocumentType;

    // 2. Delete old document if it exists on Cloudinary
    const existingDoc = await TutorService.getTutorDocumentByType(id, docTypeEnum);
    if (existingDoc?.publicId) {
      await deleteFromCloudinary(existingDoc.publicId);
    }

    // 3. Upload new document to Cloudinary
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const publicId = `doc_${type.toLowerCase()}_${sanitizedId}`;

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/tutors/documents",
      publicId,
      false
    );

    // 4. Save to Database
    const result = await TutorService.upsertTutorDocument(
      id,
      docTypeEnum,
      uploadResult.secure_url,
      uploadResult.public_id
    );

    res.status(200).json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const TutorController = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile,
    uploadPhoto,
    uploadDocument
}
