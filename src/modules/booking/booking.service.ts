import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notification/notification.service";

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


    const booking = await prisma.booking.create({
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
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },
            student: {
                select: {
                    name: true
                }
            }
        }
    });

    // Notify student: Booking confirmed
    await NotificationService.createNotification({
      receiverId: studentId,
      receiverRole: "STUDENT",
      title: "Booking Confirmed",
      message: `Your booking with ${booking.tutor.user.name} for ${payload.subject} is confirmed.`,
      type: "BOOKING_CONFIRMED",
      relatedId: booking.id,
    });

    // Notify tutor: New booking received
    await NotificationService.createNotification({
      receiverId: booking.tutor.userId,
      receiverRole: "TUTOR",
      title: "New Booking Received",
      message: `You have received a new booking from ${booking.student.name} for ${payload.subject}.`,
      type: "NEW_BOOKING_RECEIVED",
      relatedId: booking.id,
    });

    // Notify admins: New booking created
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" }
    });
    for (const admin of admins) {
      await NotificationService.createNotification({
        receiverId: admin.id,
        receiverRole: "ADMIN",
        title: "New Booking Created",
        message: `A new booking has been created between student ${booking.student.name} and tutor ${booking.tutor.user.name}.`,
        type: "NEW_BOOKING_CREATED",
        relatedId: booking.id,
      });
    }

    return booking;
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
        include: {
            tutor: {
                include: {
                    user: true
                }
            },
            student: true
        }
    })

    if (booking.tutorId !== tutorId) {
        throw new Error("You are not authorized to update this booking")
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status }
    })

    if (status === "COMPLETED") {
        // Tutor marks a session as completed -> notify the student
        await NotificationService.createNotification({
          receiverId: booking.studentId,
          receiverRole: "STUDENT",
          title: "Session Completed",
          message: `Your session with ${booking.tutor.user.name} for ${booking.subject} has been marked as completed.`,
          type: "SESSION_COMPLETED",
          relatedId: booking.id,
        });

        // Booking marked completed -> notify the tutor
        await NotificationService.createNotification({
          receiverId: booking.tutor.userId,
          receiverRole: "TUTOR",
          title: "Session Completed",
          message: `Your session with student ${booking.student.name} for ${booking.subject} has been marked as completed.`,
          type: "SESSION_COMPLETED",
          relatedId: booking.id,
        });
    }

    return updated;
}

const cancleBooking = async (
    bookingId: string,
    userId: string,
    userRole: string
) => {
    const booking = await prisma.booking.findFirstOrThrow({
        where: { id: bookingId },
        include: {
            tutor: {
                include: {
                    user: true
                }
            },
            student: true
        }
    })

    
    if (booking.status === "COMPLETED") {
        throw new Error("Cannot cancel a completed booking")
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
    })

    // Notify student: Booking cancelled
    await NotificationService.createNotification({
      receiverId: booking.studentId,
      receiverRole: "STUDENT",
      title: "Booking Cancelled",
      message: `Your booking with ${booking.tutor.user.name} for ${booking.subject} has been cancelled.`,
      type: "BOOKING_CANCELLED",
      relatedId: booking.id,
    });

    // Notify tutor: Student cancels a booking (or booking cancelled)
    await NotificationService.createNotification({
      receiverId: booking.tutor.userId,
      receiverRole: "TUTOR",
      title: userRole === "STUDENT" ? "Booking Cancelled by Student" : "Booking Cancelled",
      message: `The booking for ${booking.subject} with student ${booking.student.name} has been cancelled.`,
      type: "BOOKING_CANCELLED",
      relatedId: booking.id,
    });

    return updated;
}

export const BookingService = {
    createBooking,
    getMyBookings,
    getTutorSessions,
    updateBookingsStatus,
    cancleBooking
}