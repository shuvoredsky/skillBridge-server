import {NextFunction, Request, Response} from "express"
import { UserService } from "../user/user.service";
import fs from "fs";
import path from "path";

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
      if (req.file.path && fs.existsSync(req.file.path)) {
        await fs.promises.unlink(req.file.path).catch(err => console.error("Error deleting uploaded file on invalid user ID:", err));
      }
      return res.status(404).json({ message: "Student not found" });
    }

    if (user.role !== "STUDENT") {
      if (req.file.path && fs.existsSync(req.file.path)) {
        await fs.promises.unlink(req.file.path).catch(err => console.error("Error deleting uploaded file on non-student ID:", err));
      }
      return res.status(400).json({ message: "User is not a student" });
    }

    // 2. Delete old photo if it exists on disk
    if (user.profilePhoto) {
      const oldPath = path.join(process.cwd(), user.profilePhoto);
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath).catch(err => console.error("Failed to delete old student photo:", err));
      }
    }

    // 3. Save new path relative to project root
    const relativePath = `/uploads/students/${req.file.filename}`;
    await UserService.updateUserProfilePhoto(id, relativePath);

    const photoUrl = `${req.protocol}://${req.get("host")}${relativePath}`;

    res.status(200).json({
      message: "Student profile photo uploaded successfully",
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

export const UserController = {
    getMe,
    uploadPhoto
}