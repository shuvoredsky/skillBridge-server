import { prisma } from "../../lib/prisma";


const getAllUsers = async (filters: {
  search?: string;
  role?: string;
  status?: string;
}) => {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.user.findMany({
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
          totalReviews: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


const updateUserStatus = async (
  userId: string,
  status: "ACTIVE" | "BANNED"
) => {
  
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
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
      role: true,
    },
  });
};


const getAllBookings = async (filters: {
  status?: string;
  studentId?: string;
  tutorId?: string;
}) => {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.studentId) {
    where.studentId = filters.studentId;
  }

  if (filters.tutorId) {
    where.tutorId = filters.tutorId;
  }

  return prisma.booking.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tutor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      review: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalStudents,
    totalTutors,
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalReviews,
    totalCategories,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.review.count(),
    prisma.category.count(),
  ]);

  
  const topTutors = await prisma.tutorProfile.findMany({
    take: 5,
    orderBy: { rating: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });


  const recentBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: { name: true },
      },
      tutor: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  return {
    users: {
      total: totalUsers,
      students: totalStudents,
      tutors: totalTutors,
    },
    bookings: {
      total: totalBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    reviews: {
      total: totalReviews,
    },
    categories: {
      total: totalCategories,
    },
    topTutors,
    recentBookings,
  };
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getDashboardStats,
};