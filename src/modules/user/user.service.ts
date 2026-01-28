import { prisma } from "../../lib/prisma";

const getMe = async (userId: string) => {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export const UserService = {
  getMe
}