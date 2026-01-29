import { prisma } from "../../lib/prisma";

type AvaiablityPayload = {
    dayOfWeek: string;
    startTime: Date;
    endTime: Date;
}

const createAvailability = async (
    tutorId: string,
    payload: AvaiablityPayload
)=>{

    return prisma.availability.create({
        data: {
            tutorId,
            ...payload
        }
    })

}


const updateAvailability = async (
    availabilityId: string,
    tutorId: string,
    payload: Partial<AvaiablityPayload>
)=>{

    const availability = await prisma.availability.findUniqueOrThrow({
        where:{id: availabilityId}
    })

    if(availability.tutorId !== tutorId){
        throw new Error("you are not allowed to update this availability")
    }

    return prisma.availability.update({
        where:{id: availabilityId},
        data: payload,
    })

}


const deleteAvailability = async (
    availabilityId: string,
    tutorId: string
)=>{

    const availability = await prisma.availability.findUniqueOrThrow({
        where: {id: availabilityId},
    })

    if(availability.tutorId !== tutorId){
        throw new Error("You are not allowed to delete this availability");
    }

    return prisma.availability.delete({
        where:{id: availabilityId}
    })

}

const getTutorAvailability = async (tutorId: string)=>{

    return prisma.availability.findMany({
        where: {tutorId},
        orderBy: {dayOfWeek: "asc"}
    })

}


export const AvailabilityService = {
    createAvailability,
    updateAvailability,
    deleteAvailability,
    getTutorAvailability
}

