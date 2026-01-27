import { UserRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createUser = async (sessionUser: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
})=>{
    const existingUser = await prisma.user.findUnique({
        where: {id: sessionUser.id}
    })

    if(existingUser){
        return existingUser;
    }

    return await prisma.user.create({
        data: {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            emailVerified: sessionUser.emailVerified,
            role: UserRole.STUDENT
        }
    })

}


const getMe = async (userId: string)=>{
    return prisma.user.findUniqueOrThrow({
        where: {id: userId},
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true
        }
    })
}



export const UserService = {
    createUser,
    getMe
}