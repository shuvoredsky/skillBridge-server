import { prisma } from "../../lib/prisma";

type CreateBookingPayload = {
    tutorId: string;
    date: string;     
    startTime: string; 
    endTime: string;   
    subject: string;
    notes: string;
}

const createBooking = async (
    studentId: string,
    payload: CreateBookingPayload
) => {
    
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: payload.tutorId },
    });

    if (!tutorProfile) {
        throw new Error("Tutor profile not found");
    }


    const bookingDate = new Date(`${payload.date}T00:00:00Z`);
    const startDateTime = new Date(`${payload.date}T${payload.startTime}:00Z`);
    const endDateTime = new Date(`${payload.date}T${payload.endTime}:00Z`);

    
    const existingBooking = await prisma.booking.findFirst({
        where: {
            tutorId: payload.tutorId,
            date: bookingDate,
            startTime: startDateTime,
            status: {
                in: ["CONFIRMED", "COMPLETED"]
            }
        }
    });

    if (existingBooking) {
        throw new Error("This time slot is already booked");
    }


    return prisma.booking.create({
        data: {
            studentId,
            tutorId: payload.tutorId,
            date: bookingDate,
            startTime: startDateTime,
            endTime: endDateTime,
            subject: payload.subject,
            notes: payload.notes || "",
            status: "CONFIRMED",
        },
        include: {
            tutor: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });
}

const getMyBookings = async (studentId: string) => {
    return prisma.booking.findMany({
        where: { studentId },
        include: {
            tutor: {
                include: {
                    user: {
                        select: {
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

const getTutorSessions = async (tutorId: string) => {
    return prisma.booking.findMany({
        where: { tutorId },
        include: {
            student: {
                select: {
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

const updateBookingsStatus = async (
    bookingId: string,
    tutorId: string,
    status: "COMPLETED" | "CANCELLED"
) => {
    const booking = await prisma.booking.findFirstOrThrow({
        where: { id: bookingId },
    })

    if (booking.tutorId !== tutorId) {
        throw new Error("You are not authorized to update this booking")
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status }
    })
}

const cancleBooking = async (
    bookingId: string,
    userId: string,
    userRole: string
) => {
    const booking = await prisma.booking.findFirstOrThrow({
        where: { id: bookingId },
        include: {
            tutor: true,
        }
    })

    
    if (booking.status === "COMPLETED") {
        throw new Error("Cannot cancel a completed booking")
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
    })
}

export const BookingService = {
    createBooking,
    getMyBookings,
    getTutorSessions,
    updateBookingsStatus,
    cancleBooking
}