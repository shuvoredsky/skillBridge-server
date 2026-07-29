// src/app.ts
import "dotenv/config";
import express11 from "express";
import { toNodeHandler } from "better-auth/node";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
var connectionString = process.env.DATABASE_URL;
var pool = new pg.Pool({ connectionString });
var adapter = new PrismaPg(pool);
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  plugins: [bearer()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const admins = await prisma.user.findMany({
              where: { role: "ADMIN" }
            });
            for (const admin of admins) {
              await prisma.notification.create({
                data: {
                  receiverId: admin.id,
                  receiverRole: "ADMIN",
                  title: "New User Registered",
                  message: `A new user has registered: ${user.name || user.email} (${user.role}).`,
                  type: "NEW_USER_REGISTERED",
                  relatedId: user.id
                }
              });
            }
          } catch (err) {
            console.error("Failed to create registration notification:", err);
          }
        }
      }
    }
  },
  trustedOrigins: [
    process.env.APP_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://skill-bridge-client-zeta.vercel.app",
    "https://skillbridge-server-q.onrender.com"
  ].filter(Boolean),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        required: false
      },
      phone: {
        type: "string",
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    },
    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production"
    }
  }
});

// src/app.ts
import cors from "cors";
import cookieParser from "cookie-parser";

// src/middleware/globalErrorHandler.ts
import { Prisma } from "@prisma/client";
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = err;
  if (err instanceof Error && !(err instanceof Prisma.PrismaClientKnownRequestError) && !(err instanceof Prisma.PrismaClientValidationError)) {
    statusCode = 400;
    errorMessage = err.message;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 404;
    errorMessage = "You provide incorrect field type or missing fields";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage = "An operation failed because it depends on one or more records that were not found";
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "This slot was just booked by someone else, please choose another time";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key constraints failed";
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Error Occurred during query execution";
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      errorMessage = "Authentication failed, Please check your credential";
    } else if (err.errorCode === "P1001") {
      statusCode = 400;
      errorMessage = "Can't reach database server";
    }
  }
  res.status(statusCode).json({
    message: errorMessage,
    error: errorDetails
  });
}
var globalErrorHandler_default = errorHandler;

// src/middleware/notFound.ts
function notFound(req, res) {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    date: Date()
  });
}

// src/modules/user/user.route.ts
import express from "express";

// src/modules/user/user.service.ts
var getMe = async (userId) => {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      image: true,
      profilePhoto: true,
      createdAt: true,
      updatedAt: true
    }
  });
};
var getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id }
  });
};
var updateUserProfilePhoto = async (id, profilePhoto, profilePhotoPublicId) => {
  return prisma.user.update({
    where: { id },
    data: { profilePhoto, profilePhotoPublicId }
  });
};
var UserService = {
  getMe,
  getUserById,
  updateUserProfilePhoto
};

// src/middleware/auth.ts
var auth2 = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: new Headers(req.headers)
      });
      console.log("\u{1F510} Auth Check:", {
        hasSession: !!session,
        headers: req.headers.cookie ? "Cookie present" : "No cookie",
        origin: req.headers.origin
      });
      if (!session) {
        console.log("\u274C No session found");
        return res.status(401).json({
          message: "Unauthorized - No valid session"
        });
      }
      if (!session.user) {
        console.log("\u274C Session exists but no user");
        return res.status(401).json({
          message: "Unauthorized - Invalid session"
        });
      }
      const dbUser = await UserService.getUserById(session.user.id);
      if (!dbUser || dbUser.status === "BANNED") {
        console.log("\u274C Authentication failed: User is banned or does not exist");
        return res.status(403).json({
          message: "Forbidden - Your account has been suspended"
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      console.log("\u2705 User authenticated:", req.user.email, req.user.role);
      if (roles.length && !roles.includes(req.user.role)) {
        console.log("\u274C Forbidden:", req.user.role, "not in", roles);
        return res.status(403).json({
          message: "Forbidden: you don't have permission to access this resource"
        });
      }
      next();
    } catch (error) {
      console.error("\u274C Auth error:", error);
      return res.status(401).json({
        message: "Authentication error",
        error: process.env.NODE_ENV === "development" ? error : void 0
      });
    }
  };
};
var auth_default = auth2;

// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
console.log("Cloudinary Config Loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "MISSING",
  api_key_configured: !!process.env.CLOUDINARY_API_KEY,
  api_secret_configured: !!process.env.CLOUDINARY_API_SECRET
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var uploadToCloudinary = (fileBuffer, folder, publicId, isProfilePhoto = false) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(
        new Error("Cloudinary upload failed: Missing environment credentials.")
      );
    }
    const uploadOptions = {
      folder,
      public_id: publicId,
      overwrite: true,
      resource_type: "image"
      // Always images in this application
    };
    if (isProfilePhoto) {
      uploadOptions.transformation = [
        { width: 500, height: 500, crop: "limit" }
      ];
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload returned empty response"));
        }
        const optimizedUrl = cloudinary.url(result.public_id, {
          secure: true,
          fetch_format: "auto",
          quality: "auto",
          version: result.version
        });
        resolve({
          secure_url: optimizedUrl,
          public_id: result.public_id
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};
var deleteFromCloudinary = async (publicId) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("Skipping Cloudinary deletion check: Credentials missing.");
    return;
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deletion attempt for public ID: ${publicId}. Result:`, result);
  } catch (error) {
    console.error(`Failed to delete asset from Cloudinary for public ID ${publicId}:`, error);
  }
};

// src/modules/user/user.controller.ts
var getMe2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }
    const result = await UserService.getMe(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var uploadPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or file type is invalid." });
    }
    const user = await UserService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (user.role !== "STUDENT") {
      return res.status(400).json({ message: "User is not a student" });
    }
    if (user.profilePhotoPublicId) {
      await deleteFromCloudinary(user.profilePhotoPublicId);
    } else if (user.profilePhoto) {
      console.log(`Skipping Cloudinary deletion for pre-migration local photo path: ${user.profilePhoto}`);
    }
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const publicId = `student_${sanitizedId}`;
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/students/profile-photos",
      publicId,
      true
    );
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
var UserController = {
  getMe: getMe2,
  uploadPhoto
};

// src/config/multer.ts
import multer from "multer";
import path from "path";
var createMulterUpload = (destination) => {
  const storage = multer.memoryStorage();
  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExt = path.extname(file.originalname).toLowerCase();
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
      fileSize: 5 * 1024 * 1024
      // 5MB limit
    }
  });
};
var uploadSingle = (destination, fieldName) => {
  const upload = createMulterUpload(destination).single(fieldName);
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message: "File is too large. Maximum size allowed is 5MB.",
              error: err.message
            });
          }
          return res.status(400).json({
            message: "File upload protocol error.",
            error: err.message
          });
        }
        return res.status(400).json({
          message: err.message || "Invalid file or upload error.",
          error: err.message || err
        });
      }
      next();
    });
  };
};

// src/modules/user/user.route.ts
var router = express.Router();
router.get(
  "/me",
  auth_default("STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */, "TUTOR" /* TUTOR */),
  UserController.getMe
);
router.post(
  "/:id/upload-photo",
  uploadSingle("students", "photo"),
  UserController.uploadPhoto
);
var userRouter = router;

// src/modules/tutor/tutor.route.ts
import express2 from "express";

// src/modules/notification/notification.service.ts
var createNotification = async (payload) => {
  return prisma.notification.create({
    data: payload
  });
};
var getNotifications = async (receiverId) => {
  return prisma.notification.findMany({
    where: { receiverId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
};
var getUnreadCount = async (receiverId) => {
  return prisma.notification.count({
    where: {
      receiverId,
      isRead: false
    }
  });
};
var markAllRead = async (receiverId) => {
  return prisma.notification.updateMany({
    where: {
      receiverId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
};
var NotificationService = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllRead
};

// src/modules/tutor/tutor.service.ts
var createTutorProfile = async (userId, payload) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });
  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (existingProfile) {
    throw new Error("Tutor profile already exists");
  }
  const tutorProfile = await prisma.$transaction(async (tx) => {
    const profile = await tx.tutorProfile.create({
      data: {
        userId,
        ...payload
      },
      include: {
        user: true
      }
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        role: "TUTOR" /* TUTOR */
      }
    });
    return profile;
  });
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" }
  });
  for (const admin of admins) {
    await NotificationService.createNotification({
      receiverId: admin.id,
      receiverRole: "ADMIN",
      title: "New Tutor Registered",
      message: `A new tutor has registered: ${tutorProfile.user.name || tutorProfile.user.email}.`,
      type: "NEW_TUTOR_REGISTERED",
      relatedId: tutorProfile.id
    });
  }
  return tutorProfile;
};
var getAllTutors = async (filters) => {
  const where = {
    verificationStatus: "APPROVED",
    user: {
      status: "ACTIVE"
    }
  };
  if (filters.search) {
    where.user = {
      ...where.user,
      name: {
        contains: filters.search,
        mode: "insensitive"
      }
    };
  }
  if (filters.subject) {
    where.subjects = {
      has: filters.subject
    };
  }
  if (filters.minPrice || filters.maxPrice) {
    where.hourlyRate = {};
    if (filters.minPrice) where.hourlyRate.gte = filters.minPrice;
    if (filters.maxPrice) where.hourlyRate.lte = filters.maxPrice;
  }
  if (filters.minRating) {
    where.rating = {
      gte: filters.minRating
    };
  }
  const page = filters.page || 1;
  const limit = filters.limit || 9;
  const skip = (page - 1) * limit;
  const [total, data] = await Promise.all([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true
          }
        }
      },
      orderBy: {
        rating: "desc"
      },
      skip,
      take: limit
    })
  ]);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getMyTutorProfile = async (userId) => {
  return prisma.tutorProfile.findFirstOrThrow({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      documents: true
    }
  });
};
var updateTutorProfile = async (userId, payload) => {
  const profile = await prisma.tutorProfile.findUniqueOrThrow({
    where: { userId }
  });
  return prisma.tutorProfile.update({
    where: { id: profile.id },
    data: payload
  });
};
var getTutorById = async (tutorId) => {
  const tutor = await prisma.tutorProfile.findUniqueOrThrow({
    where: { id: tutorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true
        }
      },
      reviews: {
        include: {
          student: {
            select: {
              name: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      }
    }
  });
  if (tutor.verificationStatus !== "APPROVED" || tutor.user.status !== "ACTIVE") {
    throw new Error("Tutor profile is not publicly visible");
  }
  return tutor;
};
var getTutorProfileOnly = async (id) => {
  return prisma.tutorProfile.findUnique({
    where: { id }
  });
};
var updateTutorProfilePhoto = async (id, profilePhoto, profilePhotoPublicId) => {
  return prisma.tutorProfile.update({
    where: { id },
    data: { profilePhoto, profilePhotoPublicId }
  });
};
var upsertTutorDocument = async (tutorId, type, url, publicId) => {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.tutorDocument.upsert({
      where: {
        tutorId_type: { tutorId, type }
      },
      update: { url, publicId },
      create: { tutorId, type, url, publicId }
    });
    await tx.tutorProfile.update({
      where: { id: tutorId },
      data: { verificationStatus: "PENDING" }
    });
    return doc;
  });
};
var getTutorDocumentByType = async (tutorId, type) => {
  return prisma.tutorDocument.findUnique({
    where: {
      tutorId_type: { tutorId, type }
    }
  });
};
var TutorService = {
  createTutorProfile,
  getAllTutors,
  getMyTutorProfile,
  getTutorById,
  updateTutorProfile,
  getTutorProfileOnly,
  updateTutorProfilePhoto,
  upsertTutorDocument,
  getTutorDocumentByType
};

// src/modules/tutor/tutor.controller.ts
var createTutorProfile2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await TutorService.createTutorProfile(user.id, req.body);
    res.status(201).json({
      message: "Tutor profile create successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllTutors2 = async (req, res, next) => {
  try {
    const { search, subject, minPrice, maxPrice, minRating, page, limit } = req.query;
    const filters = {
      search,
      subject,
      minPrice: minPrice ? Number(minPrice) : void 0,
      maxPrice: maxPrice ? Number(maxPrice) : void 0,
      minRating: minRating ? Number(minRating) : void 0,
      page: page ? Number(page) : void 0,
      limit: limit ? Number(limit) : void 0
    };
    const result = await TutorService.getAllTutors(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getMyTutorProfile2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await TutorService.getMyTutorProfile(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var updateTutorProfile2 = async (req, res, next) => {
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
var getTutorById2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await TutorService.getTutorById(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var uploadPhoto2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or file type is invalid." });
    }
    const tutorProfile = await TutorService.getTutorProfileOnly(id);
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    if (tutorProfile.profilePhotoPublicId) {
      await deleteFromCloudinary(tutorProfile.profilePhotoPublicId);
    } else if (tutorProfile.profilePhoto) {
      console.log(`Skipping Cloudinary deletion for pre-migration local photo path: ${tutorProfile.profilePhoto}`);
    }
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const publicId = `tutor_${sanitizedId}`;
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/tutors/profile-photos",
      publicId,
      true
    );
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
var uploadDocument = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    if (!type || !["degree", "nid", "certificate"].includes(type.toLowerCase())) {
      return res.status(400).json({ message: "Invalid document type. Must be degree, nid, or certificate" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or file type is invalid." });
    }
    const tutorProfile = await TutorService.getTutorProfileOnly(id);
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    const docTypeEnum = type.toUpperCase();
    const existingDoc = await TutorService.getTutorDocumentByType(id, docTypeEnum);
    if (existingDoc?.publicId) {
      await deleteFromCloudinary(existingDoc.publicId);
    }
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const publicId = `doc_${type.toLowerCase()}_${sanitizedId}`;
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/tutors/documents",
      publicId,
      false
    );
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
var TutorController = {
  createTutorProfile: createTutorProfile2,
  getAllTutors: getAllTutors2,
  getMyTutorProfile: getMyTutorProfile2,
  getTutorById: getTutorById2,
  updateTutorProfile: updateTutorProfile2,
  uploadPhoto: uploadPhoto2,
  uploadDocument
};

// src/modules/tutor/tutor.route.ts
var router2 = express2.Router();
router2.get("/", TutorController.getAllTutors);
router2.post(
  "/profile",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  TutorController.createTutorProfile
);
router2.put(
  "/profile",
  auth_default("TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  TutorController.updateTutorProfile
);
router2.get(
  "/profile/me",
  auth_default("TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  TutorController.getMyTutorProfile
);
router2.get("/:id", TutorController.getTutorById);
router2.post(
  "/:id/upload-photo",
  uploadSingle("tutors", "photo"),
  TutorController.uploadPhoto
);
router2.post(
  "/:id/documents/:type",
  uploadSingle("certificates", "document"),
  TutorController.uploadDocument
);
var tutorRouter = router2;

// src/modules/category/category.route.ts
import express3 from "express";

// src/modules/category/category.service.ts
var createCategory = async (data) => {
  const existing = await prisma.category.findUnique({
    where: { name: data.name }
  });
  if (existing) {
    throw new Error("Category already exists");
  }
  return prisma.category.create({
    data
  });
};
var getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: "desc" }
  });
};
var updateCategory = async (id, data) => {
  await prisma.category.findUniqueOrThrow({
    where: { id }
  });
  return prisma.category.update({
    where: { id },
    data
  });
};
var deleteCategory = async (id) => {
  await prisma.category.findUniqueOrThrow({
    where: { id }
  });
  return prisma.category.delete({
    where: { id }
  });
};
var CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};

// src/modules/category/category.controller.ts
var createCategory2 = async (req, res, next) => {
  try {
    const result = await CategoryService.createCategory(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
var getAllCategories2 = async (req, res, next) => {
  try {
    const result = await CategoryService.getAllCategories();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var updatedCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CategoryService.updateCategory(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var deleteCategory2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CategoryService.deleteCategory(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var CategoryController = {
  createCategory: createCategory2,
  getAllCategories: getAllCategories2,
  updatedCategory,
  deleteCategory: deleteCategory2
};

// src/modules/category/category.route.ts
var router3 = express3.Router();
router3.get("/", CategoryController.getAllCategories);
router3.post(
  "/",
  auth_default("ADMIN" /* ADMIN */),
  CategoryController.createCategory
);
router3.put("/:id", auth_default("ADMIN" /* ADMIN */), CategoryController.updatedCategory);
router3.delete("/:id", auth_default("ADMIN" /* ADMIN */), CategoryController.deleteCategory);
var categoryRouter = router3;

// src/modules/availability/availability.route.ts
import express4 from "express";

// src/modules/availability/availability.service.ts
var createAvailability = async (tutorId, payload) => {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return prisma.availability.create({
    data: {
      tutorId,
      dayOfWeek: payload.dayOfWeek,
      startTime: /* @__PURE__ */ new Date(`${today}T${payload.startTime}:00Z`),
      endTime: /* @__PURE__ */ new Date(`${today}T${payload.endTime}:00Z`)
    }
  });
};
var updateAvailability = async (availabilityId, tutorId, payload) => {
  const availability = await prisma.availability.findUniqueOrThrow({
    where: { id: availabilityId }
  });
  if (availability.tutorId !== tutorId) {
    throw new Error("you are not allowed to update this availability");
  }
  return prisma.availability.update({
    where: { id: availabilityId },
    data: payload
  });
};
var deleteAvailability = async (availabilityId, tutorId) => {
  const availability = await prisma.availability.findUniqueOrThrow({
    where: { id: availabilityId }
  });
  if (availability.tutorId !== tutorId) {
    throw new Error("You are not allowed to delete this availability");
  }
  return prisma.availability.delete({
    where: { id: availabilityId }
  });
};
var getTutorAvailability = async (tutorId) => {
  return prisma.availability.findMany({
    where: { tutorId },
    orderBy: { dayOfWeek: "asc" }
  });
};
var AvailabilityService = {
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getTutorAvailability
};

// src/modules/availability/availability.controller.ts
var createAvailability2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    const result = await AvailabilityService.createAvailability(
      tutorProfile.id,
      req.body
    );
    res.status(201).json({
      message: "Availability created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateAvailability2 = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || user.role !== "TUTOR") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    const result = await AvailabilityService.updateAvailability(
      id,
      tutorProfile.id,
      req.body
    );
    res.status(200).json({
      message: "Availability updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteAvailability2 = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || user.role !== "TUTOR") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    await AvailabilityService.deleteAvailability(id, tutorProfile.id);
    res.status(200).json({
      message: "Availability deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var getTutorAvailability2 = async (req, res, next) => {
  try {
    const { tutorId } = req.params;
    const result = await AvailabilityService.getTutorAvailability(tutorId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var AvailabilityController = {
  createAvailability: createAvailability2,
  updateAvailability: updateAvailability2,
  deleteAvailability: deleteAvailability2,
  getTutorAvailability: getTutorAvailability2
};

// src/modules/availability/availability.route.ts
var router4 = express4.Router();
router4.post("/", auth_default("TUTOR" /* TUTOR */), AvailabilityController.createAvailability);
router4.put(
  "/:id",
  auth_default("TUTOR" /* TUTOR */),
  AvailabilityController.updateAvailability
);
router4.delete(
  "/:id",
  auth_default("TUTOR" /* TUTOR */),
  AvailabilityController.deleteAvailability
);
router4.get("/:tutorId", AvailabilityController.getTutorAvailability);
var availabilityRouter = router4;

// src/modules/booking/booking.route.ts
import express5 from "express";

// src/modules/booking/booking.service.ts
import { Prisma as Prisma2 } from "@prisma/client";
var createBooking = async (studentId, payload) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: payload.tutorId }
  });
  if (!tutorProfile) {
    throw new Error("Tutor profile not found");
  }
  const bookingDate = /* @__PURE__ */ new Date(`${payload.date}T00:00:00Z`);
  const startDateTime = /* @__PURE__ */ new Date(`${payload.date}T${payload.startTime}:00Z`);
  const endDateTime = /* @__PURE__ */ new Date(`${payload.date}T${payload.endTime}:00Z`);
  try {
    const booking = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "TutorProfile" WHERE id = ${payload.tutorId} FOR UPDATE`;
      const existingBooking = await tx.booking.findFirst({
        where: {
          tutorId: payload.tutorId,
          date: bookingDate,
          startTime: startDateTime,
          status: {
            in: ["CONFIRMED", "COMPLETED"]
          }
        }
      });
      if (existingBooking) {
        throw new Error("This time slot is already booked");
      }
      return tx.booking.create({
        data: {
          studentId,
          tutorId: payload.tutorId,
          date: bookingDate,
          startTime: startDateTime,
          endTime: endDateTime,
          subject: payload.subject,
          notes: payload.notes || "",
          status: "CONFIRMED"
        },
        include: {
          tutor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          student: {
            select: {
              name: true
            }
          }
        }
      });
    });
    await NotificationService.createNotification({
      receiverId: studentId,
      receiverRole: "STUDENT",
      title: "Booking Confirmed",
      message: `Your booking with ${booking.tutor.user.name} for ${payload.subject} is confirmed.`,
      type: "BOOKING_CONFIRMED",
      relatedId: booking.id
    });
    await NotificationService.createNotification({
      receiverId: booking.tutor.userId,
      receiverRole: "TUTOR",
      title: "New Booking Received",
      message: `You have received a new booking from ${booking.student.name} for ${payload.subject}.`,
      type: "NEW_BOOKING_RECEIVED",
      relatedId: booking.id
    });
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" }
    });
    for (const admin of admins) {
      await NotificationService.createNotification({
        receiverId: admin.id,
        receiverRole: "ADMIN",
        title: "New Booking Created",
        message: `A new booking has been created between student ${booking.student.name} and tutor ${booking.tutor.user.name}.`,
        type: "NEW_BOOKING_CREATED",
        relatedId: booking.id
      });
    }
    return booking;
  } catch (error) {
    if (error instanceof Prisma2.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This slot was just booked by someone else, please choose another time");
    }
    throw error;
  }
};
var getMyBookings = async (studentId) => {
  return prisma.booking.findMany({
    where: { studentId },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      },
      review: true
    },
    orderBy: {
      date: "desc"
    }
  });
};
var getTutorSessions = async (tutorId) => {
  return prisma.booking.findMany({
    where: { tutorId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      review: true
    },
    orderBy: {
      date: "desc"
    }
  });
};
var updateBookingsStatus = async (bookingId, tutorId, status) => {
  const booking = await prisma.booking.findFirstOrThrow({
    where: { id: bookingId },
    include: {
      tutor: {
        include: {
          user: true
        }
      },
      student: true
    }
  });
  if (booking.tutorId !== tutorId) {
    throw new Error("You are not authorized to update this booking");
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status }
  });
  if (status === "COMPLETED") {
    await NotificationService.createNotification({
      receiverId: booking.studentId,
      receiverRole: "STUDENT",
      title: "Session Completed",
      message: `Your session with ${booking.tutor.user.name} for ${booking.subject} has been marked as completed.`,
      type: "SESSION_COMPLETED",
      relatedId: booking.id
    });
    await NotificationService.createNotification({
      receiverId: booking.tutor.userId,
      receiverRole: "TUTOR",
      title: "Session Completed",
      message: `Your session with student ${booking.student.name} for ${booking.subject} has been marked as completed.`,
      type: "SESSION_COMPLETED",
      relatedId: booking.id
    });
  }
  return updated;
};
var cancleBooking = async (bookingId, userId, userRole) => {
  const booking = await prisma.booking.findFirstOrThrow({
    where: { id: bookingId },
    include: {
      tutor: {
        include: {
          user: true
        }
      },
      student: true
    }
  });
  if (booking.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed booking");
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" }
  });
  await NotificationService.createNotification({
    receiverId: booking.studentId,
    receiverRole: "STUDENT",
    title: "Booking Cancelled",
    message: `Your booking with ${booking.tutor.user.name} for ${booking.subject} has been cancelled.`,
    type: "BOOKING_CANCELLED",
    relatedId: booking.id
  });
  await NotificationService.createNotification({
    receiverId: booking.tutor.userId,
    receiverRole: "TUTOR",
    title: userRole === "STUDENT" ? "Booking Cancelled by Student" : "Booking Cancelled",
    message: `The booking for ${booking.subject} with student ${booking.student.name} has been cancelled.`,
    type: "BOOKING_CANCELLED",
    relatedId: booking.id
  });
  return updated;
};
var updateBookingMeetingLink = async (bookingId, tutorId, meetingLink, meetingPlatform) => {
  try {
    new URL(meetingLink);
  } catch (_) {
    throw new Error("Invalid meeting link URL format");
  }
  const urlLower = meetingLink.toLowerCase();
  if (meetingPlatform === "GOOGLE_MEET" && !urlLower.includes("google")) {
    throw new Error("URL does not match Google Meet platform selection");
  }
  if (meetingPlatform === "ZOOM" && !urlLower.includes("zoom")) {
    throw new Error("URL does not match Zoom platform selection");
  }
  if (meetingPlatform === "MS_TEAMS" && !urlLower.includes("teams") && !urlLower.includes("microsoft")) {
    throw new Error("URL does not match Microsoft Teams platform selection");
  }
  const booking = await prisma.booking.findFirstOrThrow({
    where: { id: bookingId },
    include: {
      tutor: {
        include: {
          user: true
        }
      },
      student: true
    }
  });
  if (booking.tutorId !== tutorId) {
    throw new Error("You are not authorized to update this booking");
  }
  if (booking.status !== "CONFIRMED") {
    throw new Error("Meeting link can only be updated for confirmed bookings");
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      meetingLink,
      meetingPlatform
    }
  });
  await NotificationService.createNotification({
    receiverId: booking.studentId,
    receiverRole: "STUDENT",
    title: "Meeting Link Added",
    message: `Your tutor ${booking.tutor.user.name} has added a meeting link (${meetingPlatform.replace("_", " ")}) for your upcoming session for ${booking.subject}.`,
    type: "MEETING_LINK_ADDED",
    relatedId: booking.id
  });
  return updated;
};
var BookingService = {
  createBooking,
  getMyBookings,
  getTutorSessions,
  updateBookingsStatus,
  cancleBooking,
  updateBookingMeetingLink
};

// src/modules/booking/booking.controller.ts
var createBooking2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await BookingService.createBooking(user.id, req.body);
    res.status(201).json({
      message: "Booking created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyBookings2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await BookingService.getMyBookings(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getTutorSessions2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    const result = await BookingService.getTutorSessions(tutorProfile.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var updateBookingStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    const result = await BookingService.updateBookingsStatus(
      id,
      tutorProfile.id,
      status
    );
    res.status(200).json({
      message: "Booking status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var cancelBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await BookingService.cancleBooking(id, user.id, user.role);
    res.status(200).json({
      message: "Booking cancelled successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateBookingMeetingLink2 = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { meetingLink, meetingPlatform } = req.body;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!meetingLink || !meetingPlatform) {
      return res.status(400).json({ message: "meetingLink and meetingPlatform are required" });
    }
    if (!["GOOGLE_MEET", "ZOOM", "MS_TEAMS"].includes(meetingPlatform)) {
      return res.status(400).json({ message: "Invalid meeting platform selection" });
    }
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }
    const result = await BookingService.updateBookingMeetingLink(
      id,
      tutorProfile.id,
      meetingLink,
      meetingPlatform
    );
    res.status(200).json({
      message: "Meeting link updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var BookingController = {
  createBooking: createBooking2,
  getMyBookings: getMyBookings2,
  getTutorSessions: getTutorSessions2,
  updateBookingStatus,
  cancelBooking,
  updateBookingMeetingLink: updateBookingMeetingLink2
};

// src/modules/booking/booking.route.ts
var router5 = express5.Router();
router5.post(
  "/",
  auth_default("STUDENT" /* STUDENT */),
  BookingController.createBooking
);
router5.get(
  "/my-bookings",
  auth_default("STUDENT" /* STUDENT */),
  BookingController.getMyBookings
);
router5.get(
  "/my-sessions",
  auth_default("TUTOR" /* TUTOR */),
  BookingController.getTutorSessions
);
router5.patch(
  "/:id/status",
  auth_default("TUTOR" /* TUTOR */),
  BookingController.updateBookingStatus
);
router5.patch(
  "/:id/meeting-link",
  auth_default("TUTOR" /* TUTOR */),
  BookingController.updateBookingMeetingLink
);
router5.delete(
  "/:id",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  BookingController.cancelBooking
);
var bookingRouter = router5;

// src/modules/review/review.route.ts
import express6 from "express";

// src/modules/review/review.service.ts
var createReview = async (studentId, payload) => {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: payload.bookingId },
    include: { tutor: true }
  });
  if (booking.studentId !== studentId) {
    throw new Error("You can only review your own bookings");
  }
  if (booking.status !== "COMPLETED") {
    throw new Error("You can only review completed bookings");
  }
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: payload.bookingId }
  });
  if (existingReview) {
    throw new Error("You have already reviewed this booking");
  }
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  const review = await prisma.$transaction(async (tx) => {
    const review2 = await tx.review.create({
      data: {
        bookingId: payload.bookingId,
        studentId,
        tutorId: booking.tutorId,
        rating: payload.rating,
        comment: payload.comment
      },
      include: {
        student: {
          select: {
            name: true,
            image: true
          }
        }
      }
    });
    const reviews = await tx.review.findMany({
      where: { tutorId: booking.tutorId },
      select: { rating: true }
    });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;
    await tx.tutorProfile.update({
      where: { id: booking.tutorId },
      data: {
        rating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length
      }
    });
    return review2;
  });
  await NotificationService.createNotification({
    receiverId: booking.tutor.userId,
    receiverRole: "TUTOR",
    title: "New Review Received",
    message: `Student ${review.student.name} left you a ${payload.rating}-star review.`,
    type: "NEW_REVIEW",
    relatedId: review.id
  });
  return review;
};
var getTutorReviews = async (tutorId) => {
  return prisma.review.findMany({
    where: { tutorId },
    include: {
      student: {
        select: {
          name: true,
          image: true
        }
      },
      booking: {
        select: {
          subject: true,
          date: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
var updateReview = async (reviewId, studentId, payload) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
    include: { booking: true }
  });
  if (review.studentId !== studentId) {
    throw new Error("You can only update your own reviews");
  }
  if (payload.rating && (payload.rating < 1 || payload.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }
  return prisma.$transaction(async (tx) => {
    const updatedReview = await tx.review.update({
      where: { id: reviewId },
      data: payload
    });
    const reviews = await tx.review.findMany({
      where: { tutorId: review.tutorId },
      select: { rating: true }
    });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;
    await tx.tutorProfile.update({
      where: { id: review.tutorId },
      data: {
        rating: parseFloat(averageRating.toFixed(2))
      }
    });
    return updatedReview;
  });
};
var deleteReview = async (reviewId, studentId) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId }
  });
  if (review.studentId !== studentId) {
    throw new Error("You can only delete your own reviews");
  }
  return prisma.$transaction(async (tx) => {
    await tx.review.delete({
      where: { id: reviewId }
    });
    const reviews = await tx.review.findMany({
      where: { tutorId: review.tutorId },
      select: { rating: true }
    });
    const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await tx.tutorProfile.update({
      where: { id: review.tutorId },
      data: {
        rating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length
      }
    });
    return { message: "Review deleted successfully" };
  });
};
var ReviewService = {
  createReview,
  getTutorReviews,
  updateReview,
  deleteReview
};

// src/modules/review/review.controller.ts
var createReview2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await ReviewService.createReview(user.id, req.body);
    res.status(201).json({
      message: "Review created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getTutorReviews2 = async (req, res, next) => {
  try {
    const { tutorId } = req.params;
    const result = await ReviewService.getTutorReviews(tutorId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var updateReview2 = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await ReviewService.updateReview(id, user.id, req.body);
    res.status(200).json({
      message: "Review updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteReview2 = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await ReviewService.deleteReview(id, user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var ReviewController = {
  createReview: createReview2,
  getTutorReviews: getTutorReviews2,
  updateReview: updateReview2,
  deleteReview: deleteReview2
};

// src/modules/review/review.route.ts
var router6 = express6.Router();
router6.post("/", auth_default("STUDENT" /* STUDENT */), ReviewController.createReview);
router6.get("/tutor/:tutorId", ReviewController.getTutorReviews);
router6.put("/:id", auth_default("STUDENT" /* STUDENT */), ReviewController.updateReview);
router6.delete("/:id", auth_default("STUDENT" /* STUDENT */), ReviewController.deleteReview);
var reviewRouter = router6;

// src/modules/admin/admin.route.ts
import express7 from "express";

// src/modules/admin/admin.service.ts
var getAllUsers = async (filters) => {
  const where = {};
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } }
    ];
  }
  if (filters.role) {
    where.role = filters.role;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        tutorProfile: {
          select: {
            id: true,
            rating: true,
            totalReviews: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    })
  ]);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var updateUserStatus = async (userId, status) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });
  if (user.role === "ADMIN") {
    throw new Error("Cannot ban admin users");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
};
var getAllBookings = async (filters) => {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.studentId) {
    where.studentId = filters.studentId;
  }
  if (filters.tutorId) {
    where.tutorId = filters.tutorId;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const [total, data] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        review: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    })
  ]);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getDashboardStats = async () => {
  const [
    totalUsers,
    totalStudents,
    totalTutors,
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalReviews,
    totalCategories
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.review.count(),
    prisma.category.count()
  ]);
  const topTutors = await prisma.tutorProfile.findMany({
    take: 5,
    orderBy: { rating: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  const recentBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: { name: true }
      },
      tutor: {
        include: {
          user: {
            select: { name: true }
          }
        }
      }
    }
  });
  return {
    users: {
      total: totalUsers,
      students: totalStudents,
      tutors: totalTutors
    },
    bookings: {
      total: totalBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings
    },
    reviews: {
      total: totalReviews
    },
    categories: {
      total: totalCategories
    },
    topTutors,
    recentBookings
  };
};
var getPendingTutors = async (filters) => {
  const where = {
    verificationStatus: "PENDING"
  };
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;
  const [total, data] = await Promise.all([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            status: true
          }
        },
        documents: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    })
  ]);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var approveTutor = async (tutorId) => {
  const tutor = await prisma.tutorProfile.findUniqueOrThrow({
    where: { id: tutorId },
    include: { user: true }
  });
  const updatedTutor = await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      verificationStatus: "APPROVED",
      rejectionReason: null
    },
    include: {
      user: true,
      documents: true
    }
  });
  await NotificationService.createNotification({
    receiverId: tutor.userId,
    receiverRole: "TUTOR",
    title: "Profile Approved",
    message: "Your tutor profile has been approved! You are now publicly visible and bookable.",
    type: "TUTOR_PROFILE_APPROVED",
    relatedId: tutor.id
  });
  return updatedTutor;
};
var rejectTutor = async (tutorId, rejectionReason) => {
  const tutor = await prisma.tutorProfile.findUniqueOrThrow({
    where: { id: tutorId },
    include: { user: true }
  });
  const updatedTutor = await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      verificationStatus: "REJECTED",
      rejectionReason: rejectionReason || null
    },
    include: {
      user: true,
      documents: true
    }
  });
  await NotificationService.createNotification({
    receiverId: tutor.userId,
    receiverRole: "TUTOR",
    title: "Profile Rejected",
    message: `Your tutor profile has been rejected. Reason: ${rejectionReason || "No details provided."}`,
    type: "TUTOR_PROFILE_REJECTED",
    relatedId: tutor.id
  });
  return updatedTutor;
};
var getUserGrowth = async (range, granularity) => {
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - range);
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate
      }
    },
    select: {
      createdAt: true,
      role: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const groups = {};
  users.forEach((user) => {
    let key = "";
    const date = new Date(user.createdAt);
    if (granularity === "day") {
      key = date.toISOString().split("T")[0];
    } else if (granularity === "week") {
      const day = date.getDay();
      const diff = date.getDate() - day;
      const startOfWeek = new Date(date.setDate(diff));
      key = startOfWeek.toISOString().split("T")[0];
    } else if (granularity === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!groups[key]) {
      groups[key] = { student: 0, tutor: 0, admin: 0, total: 0 };
    }
    const role = user.role.toLowerCase();
    if (groups[key][role] !== void 0) {
      groups[key][role]++;
    }
    groups[key].total++;
  });
  return Object.entries(groups).map(([date, data]) => ({
    date,
    ...data
  }));
};
var getRevenueTrend = async (range, granularity) => {
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - range);
  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: startDate
      }
    },
    select: {
      createdAt: true,
      startTime: true,
      endTime: true,
      tutor: {
        select: {
          hourlyRate: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const groups = {};
  bookings.forEach((booking) => {
    let key = "";
    const date = new Date(booking.createdAt);
    if (granularity === "day") {
      key = date.toISOString().split("T")[0];
    } else if (granularity === "week") {
      const day = date.getDay();
      const diff = date.getDate() - day;
      const startOfWeek = new Date(date.setDate(diff));
      key = startOfWeek.toISOString().split("T")[0];
    } else if (granularity === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    const duration = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1e3 * 60 * 60);
    const amount = duration * (booking.tutor?.hourlyRate || 0);
    groups[key] = (groups[key] || 0) + amount;
  });
  return Object.entries(groups).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100
  }));
};
var getBookingVolume = async (range, granularity) => {
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - range);
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: startDate
      }
    },
    select: {
      createdAt: true,
      status: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const groups = {};
  bookings.forEach((booking) => {
    let key = "";
    const date = new Date(booking.createdAt);
    if (granularity === "day") {
      key = date.toISOString().split("T")[0];
    } else if (granularity === "week") {
      const day = date.getDay();
      const diff = date.getDate() - day;
      const startOfWeek = new Date(date.setDate(diff));
      key = startOfWeek.toISOString().split("T")[0];
    } else if (granularity === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!groups[key]) {
      groups[key] = { confirmed: 0, completed: 0, cancelled: 0, total: 0 };
    }
    const status = booking.status.toLowerCase();
    if (groups[key][status] !== void 0) {
      groups[key][status]++;
    }
    groups[key].total++;
  });
  return Object.entries(groups).map(([date, data]) => ({
    date,
    ...data
  }));
};
var getTopSubjects = async () => {
  const subjects = await prisma.booking.groupBy({
    by: ["subject"],
    _count: {
      subject: true
    },
    orderBy: {
      _count: {
        subject: "desc"
      }
    },
    take: 10
  });
  return subjects.map((item) => ({
    subject: item.subject,
    count: item._count.subject
  }));
};
var getTopTutors = async (minReviews) => {
  return prisma.tutorProfile.findMany({
    where: {
      totalReviews: {
        gte: minReviews
      },
      user: {
        status: "ACTIVE"
      }
    },
    orderBy: {
      rating: "desc"
    },
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  });
};
var AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getDashboardStats,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  getUserGrowth,
  getRevenueTrend,
  getBookingVolume,
  getTopSubjects,
  getTopTutors
};

// src/modules/admin/admin.controller.ts
var getAllUsers2 = async (req, res, next) => {
  try {
    const { search, role, status, page, limit } = req.query;
    const filters = {
      search,
      role,
      status,
      page: page ? Number(page) : void 0,
      limit: limit ? Number(limit) : void 0
    };
    const result = await AdminService.getAllUsers(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var updateUserStatus2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["ACTIVE", "BANNED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be ACTIVE or BANNED"
      });
    }
    const result = await AdminService.updateUserStatus(id, status);
    res.status(200).json({
      message: `User ${status.toLowerCase()} successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllBookings2 = async (req, res, next) => {
  try {
    const { status, studentId, tutorId, page, limit } = req.query;
    const filters = {
      status,
      studentId,
      tutorId,
      page: page ? Number(page) : void 0,
      limit: limit ? Number(limit) : void 0
    };
    const result = await AdminService.getAllBookings(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getDashboardStats2 = async (req, res, next) => {
  try {
    const result = await AdminService.getDashboardStats();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getPendingTutors2 = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const filters = {
      page: page ? Number(page) : void 0,
      limit: limit ? Number(limit) : void 0
    };
    const result = await AdminService.getPendingTutors(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var approveTutor2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await AdminService.approveTutor(id);
    res.status(200).json({
      message: "Tutor profile approved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var rejectTutor2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const result = await AdminService.rejectTutor(id, rejectionReason);
    res.status(200).json({
      message: "Tutor profile rejected successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getUserGrowth2 = async (req, res, next) => {
  try {
    const range = parseInt(req.query.range) || 30;
    const granularity = req.query.granularity || "day";
    const result = await AdminService.getUserGrowth(range, granularity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getRevenueTrend2 = async (req, res, next) => {
  try {
    const range = parseInt(req.query.range) || 30;
    const granularity = req.query.granularity || "day";
    const result = await AdminService.getRevenueTrend(range, granularity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getBookingVolume2 = async (req, res, next) => {
  try {
    const range = parseInt(req.query.range) || 30;
    const granularity = req.query.granularity || "day";
    const result = await AdminService.getBookingVolume(range, granularity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getTopSubjects2 = async (req, res, next) => {
  try {
    const result = await AdminService.getTopSubjects();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getTopTutors2 = async (req, res, next) => {
  try {
    const minReviews = parseInt(req.query.minReviews) || 3;
    const result = await AdminService.getTopTutors(minReviews);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var AdminController = {
  getAllUsers: getAllUsers2,
  updateUserStatus: updateUserStatus2,
  getAllBookings: getAllBookings2,
  getDashboardStats: getDashboardStats2,
  getPendingTutors: getPendingTutors2,
  approveTutor: approveTutor2,
  rejectTutor: rejectTutor2,
  getUserGrowth: getUserGrowth2,
  getRevenueTrend: getRevenueTrend2,
  getBookingVolume: getBookingVolume2,
  getTopSubjects: getTopSubjects2,
  getTopTutors: getTopTutors2
};

// src/modules/admin/admin.route.ts
var router7 = express7.Router();
router7.get("/users", auth_default("ADMIN" /* ADMIN */), AdminController.getAllUsers);
router7.patch(
  "/users/:id/status",
  auth_default("ADMIN" /* ADMIN */),
  AdminController.updateUserStatus
);
router7.get("/bookings", auth_default("ADMIN" /* ADMIN */), AdminController.getAllBookings);
router7.get("/stats", auth_default("ADMIN" /* ADMIN */), AdminController.getDashboardStats);
router7.get("/tutors/pending", auth_default("ADMIN" /* ADMIN */), AdminController.getPendingTutors);
router7.patch("/tutors/:id/approve", auth_default("ADMIN" /* ADMIN */), AdminController.approveTutor);
router7.patch("/tutors/:id/reject", auth_default("ADMIN" /* ADMIN */), AdminController.rejectTutor);
router7.get("/analytics/user-growth", auth_default("ADMIN" /* ADMIN */), AdminController.getUserGrowth);
router7.get("/analytics/revenue", auth_default("ADMIN" /* ADMIN */), AdminController.getRevenueTrend);
router7.get("/analytics/booking-volume", auth_default("ADMIN" /* ADMIN */), AdminController.getBookingVolume);
router7.get("/analytics/top-subjects", auth_default("ADMIN" /* ADMIN */), AdminController.getTopSubjects);
router7.get("/analytics/top-tutors", auth_default("ADMIN" /* ADMIN */), AdminController.getTopTutors);
var adminRouter = router7;

// src/modules/stats/stats.route.ts
import express8 from "express";

// src/modules/stats/stats.service.ts
var getPlatformStats = async () => {
  const activeStudentsCount = await prisma.user.count({
    where: {
      role: "STUDENT",
      status: "ACTIVE"
    }
  });
  const activeTutorsCount = await prisma.tutorProfile.count({
    where: {
      user: {
        status: "ACTIVE"
      }
    }
  });
  const subjectsCount = await prisma.category.count();
  const completedBookings = await prisma.booking.count({
    where: {
      status: "COMPLETED"
    }
  });
  const totalBookings = await prisma.booking.count();
  const successRate = totalBookings > 0 ? Math.round(completedBookings / totalBookings * 100) : 98;
  return {
    students: activeStudentsCount,
    tutors: activeTutorsCount,
    subjects: subjectsCount,
    successRate
  };
};
var StatsService = {
  getPlatformStats
};

// src/modules/stats/stats.controller.ts
var getPlatformStats2 = async (req, res, next) => {
  try {
    const result = await StatsService.getPlatformStats();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var StatsController = {
  getPlatformStats: getPlatformStats2
};

// src/modules/stats/stats.route.ts
var router8 = express8.Router();
router8.get("/platform", StatsController.getPlatformStats);
var statsRouter = router8;

// src/modules/wishlist/wishlist.route.ts
import express9 from "express";

// src/modules/wishlist/wishlist.service.ts
var addToWishlist = async (studentId, tutorId) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId }
  });
  if (!tutor) {
    const error = new Error("Tutor profile not found");
    error.statusCode = 404;
    throw error;
  }
  const existing = await prisma.wishlist.findUnique({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId
      }
    }
  });
  if (existing) {
    const error = new Error("Tutor is already in your wishlist");
    error.statusCode = 400;
    throw error;
  }
  return prisma.wishlist.create({
    data: {
      studentId,
      tutorId
    },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    }
  });
};
var removeFromWishlist = async (studentId, tutorId) => {
  const existing = await prisma.wishlist.findUnique({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId
      }
    }
  });
  if (!existing) {
    const error = new Error("Tutor is not in your wishlist");
    error.statusCode = 404;
    throw error;
  }
  return prisma.wishlist.delete({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId
      }
    }
  });
};
var getWishlist = async (studentId) => {
  return prisma.wishlist.findMany({
    where: { studentId },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
var WishlistService = {
  addToWishlist,
  removeFromWishlist,
  getWishlist
};

// src/modules/wishlist/wishlist.controller.ts
var addToWishlist2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { tutorId } = req.params;
    const result = await WishlistService.addToWishlist(user.id, tutorId);
    res.status(201).json({
      message: "Tutor added to wishlist successfully",
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Something went wrong" });
  }
};
var removeFromWishlist2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { tutorId } = req.params;
    await WishlistService.removeFromWishlist(user.id, tutorId);
    res.status(200).json({
      message: "Tutor removed from wishlist successfully"
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || "Something went wrong" });
  }
};
var getWishlist2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await WishlistService.getWishlist(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var WishlistController = {
  addToWishlist: addToWishlist2,
  removeFromWishlist: removeFromWishlist2,
  getWishlist: getWishlist2
};

// src/modules/wishlist/wishlist.route.ts
var router9 = express9.Router();
router9.get(
  "/",
  auth_default("STUDENT" /* STUDENT */),
  WishlistController.getWishlist
);
router9.post(
  "/:tutorId",
  auth_default("STUDENT" /* STUDENT */),
  WishlistController.addToWishlist
);
router9.delete(
  "/:tutorId",
  auth_default("STUDENT" /* STUDENT */),
  WishlistController.removeFromWishlist
);
var wishlistRouter = router9;

// src/modules/notification/notification.route.ts
import express10 from "express";

// src/modules/notification/notification.controller.ts
var getNotifications2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await NotificationService.getNotifications(user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
var getUnreadCount2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const count = await NotificationService.getUnreadCount(user.id);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
var markAllRead2 = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await NotificationService.markAllRead(user.id);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
var NotificationController = {
  getNotifications: getNotifications2,
  getUnreadCount: getUnreadCount2,
  markAllRead: markAllRead2
};

// src/modules/notification/notification.route.ts
var router10 = express10.Router();
router10.get(
  "/",
  auth_default(),
  NotificationController.getNotifications
);
router10.get(
  "/unread-count",
  auth_default(),
  NotificationController.getUnreadCount
);
router10.patch(
  "/mark-all-read",
  auth_default(),
  NotificationController.markAllRead
);
var notificationRouter = router10;

// src/app.ts
var app = express11();
app.set("trust proxy", 1);
var getCleanOrigins = () => {
  const rawOrigins = [
    process.env.APP_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://skill-bridge-client-zeta.vercel.app"
  ];
  return rawOrigins.filter(Boolean).map((origin) => origin.replace(/\/$/, "").trim());
};
var allowedOrigins = getCleanOrigins();
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "").trim();
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.log("\u274C CORS blocked:", origin, "Allowed:", allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));
app.use(express11.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log("\u{1F4E5} Request:", {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    hasCookie: !!req.headers.cookie,
    cookies: req.cookies
    // Now this will work
  });
  next();
});
app.post("/api/tutors/:id/upload-photo", uploadSingle("tutors", "photo"), TutorController.uploadPhoto);
app.post("/api/students/:id/upload-photo", uploadSingle("students", "photo"), UserController.uploadPhoto);
app.post("/api/tutors/:id/documents/:type", uploadSingle("certificates", "document"), TutorController.uploadDocument);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tutors", tutorRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/notifications", notificationRouter);
app.get("/", (req, res) => {
  res.send("SkillBridge API is running");
});
app.use(notFound);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var port = process.env.PORT || 5e3;
prisma.$connect().catch((err) => {
  console.error("Failed to connect to the database:", err);
});
app_default.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
var server_default = app_default;
export {
  server_default as default
};
