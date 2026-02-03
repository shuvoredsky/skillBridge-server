"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const prisma_1 = require("../../lib/prisma");
const createCategory = async (data) => {
    const existing = await prisma_1.prisma.category.findUnique({
        where: { name: data.name }
    });
    if (existing) {
        throw new Error("Category already exists");
    }
    return prisma_1.prisma.category.create({
        data
    });
};
const getAllCategories = async () => {
    return prisma_1.prisma.category.findMany({
        orderBy: { createdAt: "desc" }
    });
};
const updateCategory = async (id, data) => {
    await prisma_1.prisma.category.findUniqueOrThrow({
        where: { id },
    });
    return prisma_1.prisma.category.update({
        where: { id },
        data,
    });
};
const deleteCategory = async (id) => {
    await prisma_1.prisma.category.findUniqueOrThrow({
        where: { id },
    });
    return prisma_1.prisma.category.delete({
        where: { id }
    });
};
exports.CategoryService = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};
