import { prisma } from "../../lib/prisma";

// Bug 2 Note: If this throws "Cannot read properties of undefined (reading 'findUnique')",
// it means Prisma Client needs to be regenerated and the dev server restarted.
// Run "npx prisma generate" and restart the backend server ("npm run dev").
const addToWishlist = async (studentId: string, tutorId: string) => {
  // 1. Verify tutor exists
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
  });
  if (!tutor) {
    const error: any = new Error("Tutor profile not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Check duplicate
  const existing = await prisma.wishlist.findUnique({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId,
      },
    },
  });
  if (existing) {
    const error: any = new Error("Tutor is already in your wishlist");
    error.statusCode = 400;
    throw error;
  }

  return prisma.wishlist.create({
    data: {
      studentId,
      tutorId,
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
  });
};

const removeFromWishlist = async (studentId: string, tutorId: string) => {
  // Verify existence in wishlist
  const existing = await prisma.wishlist.findUnique({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId,
      },
    },
  });
  if (!existing) {
    const error: any = new Error("Tutor is not in your wishlist");
    error.statusCode = 404;
    throw error;
  }

  return prisma.wishlist.delete({
    where: {
      studentId_tutorId: {
        studentId,
        tutorId,
      },
    },
  });
};

const getWishlist = async (studentId: string) => {
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
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const WishlistService = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
