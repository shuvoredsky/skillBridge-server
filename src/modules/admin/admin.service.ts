import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notification/notification.service";


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

const getPendingTutors = async () => {
  return prisma.tutorProfile.findMany({
    where: {
      verificationStatus: "PENDING"
    },
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
    }
  });
};

const approveTutor = async (tutorId: string) => {
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

  // Notify the tutor
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

const rejectTutor = async (tutorId: string, rejectionReason?: string) => {
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

  // Notify the tutor
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

const getUserGrowth = async (range: number, granularity: "day" | "week" | "month") => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      role: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const groups: { [key: string]: { student: number; tutor: number; admin: number; total: number } } = {};

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

    const role = user.role.toLowerCase() as "student" | "tutor" | "admin";
    if (groups[key][role] !== undefined) {
      groups[key][role]++;
    }
    groups[key].total++;
  });

  return Object.entries(groups).map(([date, data]) => ({
    date,
    ...data,
  }));
};

const getRevenueTrend = async (range: number, granularity: "day" | "week" | "month") => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      startTime: true,
      endTime: true,
      tutor: {
        select: {
          hourlyRate: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const groups: { [key: string]: number } = {};

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

    const duration = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
    const amount = duration * (booking.tutor?.hourlyRate || 0);

    groups[key] = (groups[key] || 0) + amount;
  });

  return Object.entries(groups).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
};

const getBookingVolume = async (range: number, granularity: "day" | "week" | "month") => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      status: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const groups: { [key: string]: { confirmed: number; completed: number; cancelled: number; total: number } } = {};

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

    const status = booking.status.toLowerCase() as "confirmed" | "completed" | "cancelled";
    if (groups[key][status] !== undefined) {
      groups[key][status]++;
    }
    groups[key].total++;
  });

  return Object.entries(groups).map(([date, data]) => ({
    date,
    ...data,
  }));
};

const getTopSubjects = async () => {
  const subjects = await prisma.booking.groupBy({
    by: ["subject"],
    _count: {
      subject: true,
    },
    orderBy: {
      _count: {
        subject: "desc",
      },
    },
    take: 10,
  });

  return subjects.map((item) => ({
    subject: item.subject,
    count: item._count.subject,
  }));
};

const getTopTutors = async (minReviews: number) => {
  return prisma.tutorProfile.findMany({
    where: {
      totalReviews: {
        gte: minReviews,
      },
      user: {
        status: "ACTIVE",
      },
    },
    orderBy: {
      rating: "desc",
    },
    take: 10,
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
  });
};

export const AdminService = {
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
  getTopTutors,
};