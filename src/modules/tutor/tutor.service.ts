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


const getAllTutors = async ()=>{
    return prisma.tutorProfile.findMany({
        include:{
            user:{
                select:{
                    id: true,
                    name: true,
                    email: true
                }
            }
        },

        orderBy: {
            rating: "desc"
        }

    })
}


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


export const TutorService = {
    createTutorProfile,
    getAllTutors,
    getMyTutorProfile
}
