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

const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const updateUserProfilePhoto = async (id: string, profilePhoto: string) => {
  return prisma.user.update({
    where: { id },
    data: { profilePhoto },
  });
};

export const UserService = {
  getMe,
  getUserById,
  updateUserProfilePhoto
}