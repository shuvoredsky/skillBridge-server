import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

export type UploadDestination = "tutors" | "students" | "certificates";

/**
 * Reusable Multer configuration factory.
 * @param destination Destination folder under the root uploads directory.
 */
export const createMulterUpload = (destination: UploadDestination) => {
  const uploadPath = path.join(process.cwd(), "uploads", destination);

  // Ensure directories exist locally (defensive check)
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname).toLowerCase();
      // Sanitize user ID to protect against directory traversal and keep filename clean
      const userId = req.params.id ? req.params.id.replace(/[^a-zA-Z0-9_-]/g, "") : "unknown";
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${userId}-${uniqueSuffix}${fileExt}`);
    },
  });

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
