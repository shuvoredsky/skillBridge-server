import { prisma } from "../../lib/prisma";

type CreateBookingPayload = {
    tutorId: string;
    date: string;
    startTime: string;
    endTime: string;
    subject: string
    notes: string
}

const createBooking = async (
    studentId: string,
    payload: CreateBookingPayload
)=>{

    const tutorProfile = await prisma.tutorProfile.findFirstOrThrow({
        where: {id: payload.tutorId},
    })

    const bookingDate = new Date(payload.date)

    const existingBooking = await prisma.booking.findFirst({
        where: {
            tutorId: payload.tutorId,
            date: bookingDate,
            startTime: payload.startTime,
            status:{
                in: ["CONFIRMED", "COMPLETED"]
            }   
        }
    })

    if(existingBooking){
        throw new Error("This time slot is already booked")
    }

    return prisma.booking.create({
        data: {
            studentId,
            tutorId: payload.tutorId,
            date: bookingDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      subject: payload.subject,
      notes: payload.notes,
      status: "CONFIRMED",
        },
        include: {
            tutor: {
                include: {
                    user: {
                        select:{
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    })

}


const getMyBookings = async (studentId: string) =>{

    return prisma.booking.findMany({
        where: {studentId},
        include:{
            tutor:{
                include:{
                    user:{
                        select:{
                            name: true,
                            email: true,
                            image: true
                        }
                    }
                }
            },
            review: true,
        },
        orderBy: {
            date: "desc"
        }
    })

}


const getTutorSessions = async (tutorId: string)=>{

    return prisma.booking.findMany({
        where: {tutorId},
        include:{
            student:{
                select:{
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                }
            },
            review: true,
        },
        orderBy: {
            date: "desc"
        }
    })

}


const updateBookingsStatus = async(
    bookingId: string,
    tutorId: string,
    status: "COMPLETED" | "CANCELLED"
)=>{
    const booking = await prisma.booking.findFirstOrThrow({
        where: {id: bookingId},
    })

    if(booking.tutorId !== tutorId){
        throw new Error("you are not authorized to update this booking")
    }

    return prisma.booking.update({
        where:{id: bookingId},
        data:{status}
    })
}


const cancleBooking = async (
    bookingId: string,
    userId: string,
    userRole: string
)=>{

    const booking = await prisma.booking.findFirstOrThrow({
        where:{id: bookingId},
        include:{
            tutor: true,
        }
    })

    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutor.userId === userId;

    if(booking.status === "COMPLETED"){
        throw new Error("Cannot cancel a completed booking")
    }

    return prisma.booking.update({
        where: {id: bookingId},
        data:{status: "CANCELLED"}
    })

}


export const BookingService = {
    createBooking,
    getMyBookings,
    getTutorSessions,
    updateBookingsStatus,
    cancleBooking
}