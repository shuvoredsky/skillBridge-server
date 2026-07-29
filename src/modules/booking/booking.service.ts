import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notification/notification.service";
import { Prisma } from "@prisma/client";

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

    try {
        const booking = await prisma.$transaction(async (tx) => {
            // 1. Lock the TutorProfile row to serialize concurrent booking attempts for this tutor
            await tx.$queryRaw`SELECT id FROM "TutorProfile" WHERE id = ${payload.tutorId} FOR UPDATE`;

            // 2. Check for concurrent booking inside the transaction
            const existingBooking = await tx.booking.findFirst({
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

            // 3. Create the booking inside the transaction
            return tx.booking.create({
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
        });

        // 4. Send notifications after the transaction completes successfully
        await NotificationService.createNotification({
            receiverId: studentId,
            receiverRole: "STUDENT",
            title: "Booking Confirmed",
            message: `Your booking with ${booking.tutor.user.name} for ${payload.subject} is confirmed.`,
            type: "BOOKING_CONFIRMED",
            relatedId: booking.id,
        });

        await NotificationService.createNotification({
            receiverId: booking.tutor.userId,
            receiverRole: "TUTOR",
            title: "New Booking Received",
            message: `You have received a new booking from ${booking.student.name} for ${payload.subject}.`,
            type: "NEW_BOOKING_RECEIVED",
            relatedId: booking.id,
        });

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

    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new Error("This slot was just booked by someone else, please choose another time");
        }
        throw error;
    }
};

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
};

const updateBookingMeetingLink = async (
    bookingId: string,
    tutorId: string,
    meetingLink: string,
    meetingPlatform: "GOOGLE_MEET" | "ZOOM" | "MS_TEAMS"
) => {
    // Basic URL validation
    try {
        new URL(meetingLink);
    } catch (_) {
        throw new Error("Invalid meeting link URL format");
    }

    // Lenient platform matching
    const urlLower = meetingLink.toLowerCase();
    if (meetingPlatform === "GOOGLE_MEET" && !urlLower.includes("google")) {
        throw new Error("URL does not match Google Meet platform selection");
    }
    if (meetingPlatform === "ZOOM" && !urlLower.includes("zoom")) {
        throw new Error("URL does not match Zoom platform selection");
    }
    if (meetingPlatform === "MS_TEAMS" && !urlLower.includes("teams") && !urlLower.includes("microsoft")) {
        throw new Error("URL does not match Microsoft Teams platform selection");
    }

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
    });

    if (booking.tutorId !== tutorId) {
        throw new Error("You are not authorized to update this booking");
    }

    if (booking.status !== "CONFIRMED") {
        throw new Error("Meeting link can only be updated for confirmed bookings");
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            meetingLink,
            meetingPlatform
        }
    });

    // Notify student: Meeting link added/updated
    await NotificationService.createNotification({
        receiverId: booking.studentId,
        receiverRole: "STUDENT",
        title: "Meeting Link Added",
        message: `Your tutor ${booking.tutor.user.name} has added a meeting link (${meetingPlatform.replace("_", " ")}) for your upcoming session for ${booking.subject}.`,
        type: "MEETING_LINK_ADDED",
        relatedId: booking.id,
    });

    return updated;
};

export const BookingService = {
    createBooking,
    getMyBookings,
    getTutorSessions,
    updateBookingsStatus,
    cancleBooking,
    updateBookingMeetingLink
}