import { profile } from "node:console";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../middleware/auth";
import { NotificationService } from "../notification/notification.service";
import { TutorDocumentType, TutorVerificationStatus } from "@prisma/client";

type CreateTutorPayload = {
    bio?: string;
    subjects: string[];
    hourlyRate: number;
    experience?: string;
    education?: string; 
};


const createTutorProfile = async (
  userId: string,
  payload: CreateTutorPayload
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new Error("Tutor profile already exists");
  }

  const tutorProfile = await prisma.$transaction(async (tx) => {
    const profile = await tx.tutorProfile.create({
      data: {
        userId,
        ...payload,
      },
      include: {
        user: true,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        role: UserRole.TUTOR,
      },
    });

    return profile;
  });

  // Notify admins: New tutor registered
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
      relatedId: tutorProfile.id,
    });
  }

  return tutorProfile;
};


const getAllTutors = async (filters: {
  search?: string;
  subject?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  limit?: number;
}) => {
  // Fix: Only return tutors whose associated user account is ACTIVE (not BANNED) and profile is APPROVED
  const where: any = {
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
        mode: 'insensitive'
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


const getMyTutorProfile = async(userId: string)=>{
    return prisma.tutorProfile.findFirstOrThrow({
        where: {userId},
        include: {
            user: {
                select:{
                    name: true,
                    email: true
                }
            },
            documents: true
        }
    })
}


const updateTutorProfile = async (
  userId: string,
  payload: Partial<CreateTutorPayload>
) => {
  const profile = await prisma.tutorProfile.findUniqueOrThrow({
    where: { userId }
  });

  return prisma.tutorProfile.update({
    where: { id: profile.id },
    data: payload
  });
};

const getRatingBreakdown = async (tutorId: string) => {
  const groupResults = await prisma.review.groupBy({
    by: ["rating"],
    where: { tutorId },
    _count: {
      rating: true,
    },
  });

  const breakdown: Record<number, { count: number; percentage: number }> = {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  };

  let totalCount = 0;
  groupResults.forEach((group) => {
    const rating = group.rating;
    if (breakdown[rating]) {
      const count = group._count.rating;
      breakdown[rating].count = count;
      totalCount += count;
    }
  });

  if (totalCount > 0) {
    Object.keys(breakdown).forEach((key) => {
      const rating = parseInt(key);
      const count = breakdown[rating].count;
      breakdown[rating].percentage = Math.round((count / totalCount) * 100);
    });
  }

  return breakdown;
};

const getTutorById = async (tutorId: string) => {
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
          createdAt: 'desc'
        },
        take: 10
      }
    }
  });

  if (tutor.verificationStatus !== "APPROVED" || tutor.user.status !== "ACTIVE") {
    throw new Error("Tutor profile is not publicly visible");
  }

  const ratingBreakdown = await getRatingBreakdown(tutorId);

  return {
    ...tutor,
    ratingBreakdown,
  };
};

const getTutorProfileOnly = async (id: string) => {
  return prisma.tutorProfile.findUnique({
    where: { id },
  });
};

const updateTutorProfilePhoto = async (id: string, profilePhoto: string, profilePhotoPublicId: string) => {
  return prisma.tutorProfile.update({
    where: { id },
    data: { profilePhoto, profilePhotoPublicId },
  });
};

const upsertTutorDocument = async (
  tutorId: string,
  type: TutorDocumentType,
  url: string,
  publicId: string
) => {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.tutorDocument.upsert({
      where: {
        tutorId_type: { tutorId, type }
      },
      update: { url, publicId },
      create: { tutorId, type, url, publicId }
    });

    // Reset status to PENDING on document updates to request re-review
    await tx.tutorProfile.update({
      where: { id: tutorId },
      data: { verificationStatus: "PENDING" }
    });

    return doc;
  });
};

const getTutorDocumentByType = async (tutorId: string, type: TutorDocumentType) => {
  return prisma.tutorDocument.findUnique({
    where: {
      tutorId_type: { tutorId, type }
    }
  });
};

export const TutorService = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile,
    getTutorProfileOnly,
    updateTutorProfilePhoto,
    upsertTutorDocument,
    getTutorDocumentByType
}
