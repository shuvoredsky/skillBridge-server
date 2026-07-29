import { NextFunction, Request, Response } from "express";
import { Prisma } from '@prisma/client';

function errorHandler (err: any, req: Request, res: Response, next: NextFunction) {
    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    let errorDetails = err;

    // Handle generic service / application errors cleanly as 400s
    if (err instanceof Error && !(err instanceof Prisma.PrismaClientKnownRequestError) && !(err instanceof Prisma.PrismaClientValidationError)) {
        statusCode = 400;
        errorMessage = err.message;
    }
    else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 404;
        errorMessage = "You provide incorrect field type or missing fields";
    }
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
            statusCode = 400;
            errorMessage = "An operation failed because it depends on one or more records that were not found";
        }
        else if (err.code === "P2002") {
            statusCode = 400;
            errorMessage = "This slot was just booked by someone else, please choose another time";
        }
        else if (err.code === "P2003") {
            statusCode = 400;
            errorMessage = "Foreign key constraints failed";
        }
    }
    else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = 500;
        errorMessage = "Error Occurred during query execution";
    }
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        if (err.errorCode === "P1000") {
            statusCode = 401;
            errorMessage = "Authentication failed, Please check your credential";
        }
        else if (err.errorCode === "P1001") {
            statusCode = 400;
            errorMessage = "Can't reach database server";
        }
    }

    res.status(statusCode).json({
        message: errorMessage,
        error: errorDetails
    });
}

export default errorHandler;