import { prisma } from "../../lib/prisma";

const createCategory = async (data: {name: string; description:string}) =>{
    const existing = await prisma.category.findUnique({
        where: {name: data.name}
    })

    if(existing){
        throw new Error("Category already exists");
    }

    return prisma.category.create({
        data
    })
}


const getAllCategories = async ()=>{
    return prisma.category.findMany({
        orderBy: {createdAt: "desc"}
    })
}



const updateCategory = async (
    id: string,
    data: {name: string; description?: string}
) =>{
    await prisma.category.findUniqueOrThrow({
        where: {id},
    });

    return prisma.category.update({
        where: {id},
        data,
    })

}

const deleteCategory = async (id: string)=>{
    await prisma.category.findUniqueOrThrow({
        where: {id},
    })

    return prisma.category.delete({
        where: {id}
    })
}

export const CategoryService = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
}

