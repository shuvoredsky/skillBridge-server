import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

export type UploadDestination = "tutors" | "students" | "certificates";

export const createMulterUpload = (destination: UploadDestination) => {
  const storage = multer.memoryStorage();

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExt = path.extname(file.originalname).toLowerCase();

    // Verify both MIME type and file extension for security
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });
};

/**
 * Middleware wrapper to handle single file upload with clean Express error responses.
 * @param destination The upload directory classification.
 * @param fieldName The name of the field in request form-data containing the file.
 */
export const uploadSingle = (destination: UploadDestination, fieldName: string) => {
  const upload = createMulterUpload(destination).single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message: "File is too large. Maximum size allowed is 5MB.",
              error: err.message,
            });
          }
          return res.status(400).json({
            message: "File upload protocol error.",
            error: err.message,
          });
        }
        return res.status(400).json({
          message: err.message || "Invalid file or upload error.",
          error: err.message || err,
        });
      }
      next();
    });
  };
};
