import { profile } from "node:console";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../middleware/auth";

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
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        role: UserRole.TUTOR,
      },
    });

    return profile;
  });

  return tutorProfile;
};


const getAllTutors = async (filters: {
  search?: string;
  subject?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}) => {
  const where: any = {};

  if (filters.search) {
    where.user = {
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

  return prisma.tutorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    },
    orderBy: {
      rating: "desc"
    }
  });
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
            }
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

const getTutorById = async (tutorId: string) => {
  return prisma.tutorProfile.findUniqueOrThrow({
    where: { id: tutorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
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
};


export const TutorService = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile,
    getTutorById,
    updateTutorProfile
}
