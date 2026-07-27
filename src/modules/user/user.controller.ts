import {NextFunction, Request, Response} from "express"
import { UserService } from "../user/user.service";
import { uploadToCloudinary, deleteFromCloudinary } from "../../lib/cloudinary";

const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const user = req.user;

        if(!user){
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const result = await UserService.getMe(user.id);
        res.status(200).json(result);
    } catch(error){
        next(error)
    }
}

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

    // 1. Verify user exists and has STUDENT role
    const user = await UserService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (user.role !== "STUDENT") {
      return res.status(400).json({ message: "User is not a student" });
    }

    // 2. Delete old photo if it exists on Cloudinary, otherwise skip for local files
    if (user.profilePhotoPublicId) {
      await deleteFromCloudinary(user.profilePhotoPublicId);
    } else if (user.profilePhoto) {
      console.log(`Skipping Cloudinary deletion for pre-migration local photo path: ${user.profilePhoto}`);
    }

    // 3. Upload to Cloudinary
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const publicId = `${sanitizedId}-${uniqueSuffix}`;

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/students",
      publicId
    );

    // 4. Save secure URL and public ID
    await UserService.updateUserProfilePhoto(id, uploadResult.secure_url, uploadResult.public_id);

    res.status(200).json({
      message: "Student profile photo uploaded successfully",
      profilePhoto: uploadResult.secure_url,
      profilePhotoUrl: uploadResult.secure_url
    });
  } catch (error) {
    next(error);
  }
};

export const UserController = {
    getMe,
    uploadPhoto
}