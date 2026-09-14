import { prisma } from "../../lib/prisma";

const recordView = async (studentId: string, tutorId: string) => {
  // 1. Verify tutor exists and is active/approved
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    include: {
      user: {
        select: {
          status: true,
        },
      },
    },
  });
  if (!tutor || tutor.verificationStatus !== "APPROVED" || tutor.user?.status !== "ACTIVE") {
    const error: any = new Error("Tutor profile not found or is not active");
    error.statusCode = 404;
    throw error;
  }

  // 2. Exclude viewing own profile
  if (tutor.userId === studentId) {
    return null;
  }

  // 3. Upsert the view record
  return prisma.recentlyViewedTutor.upsert({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId,
      },
    },
    update: {
      viewedAt: new Date(),
    },
    create: {
      studentId,
      tutorId,
    },
  });
};

const getRecentlyViewed = async (studentId: string) => {
  return prisma.recentlyViewedTutor.findMany({
    where: {
      studentId,
      tutor: {
        verificationStatus: "APPROVED",
        user: {
          status: "ACTIVE",
        },
      },
    },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      viewedAt: "desc",
    },
    take: 10,
  });
};

export const RecentlyViewedService = {
  recordView,
  getRecentlyViewed,
};
