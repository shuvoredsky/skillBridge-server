import { prisma } from "../../lib/prisma";
import { UserRole } from "@prisma/client";

// Reusable notification creation helper
const createNotification = async (payload: {
  receiverId: string;
  receiverRole: UserRole;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
}) => {
  return (prisma as any).notification.create({
    data: payload,
  });
};

const getNotifications = async (receiverId: string) => {
  return (prisma as any).notification.findMany({
    where: { receiverId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

const getUnreadCount = async (receiverId: string) => {
  return (prisma as any).notification.count({
    where: {
      receiverId,
      isRead: false,
    },
  });
};

const markAllRead = async (receiverId: string) => {
  return (prisma as any).notification.updateMany({
    where: {
      receiverId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

export const NotificationService = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
};
