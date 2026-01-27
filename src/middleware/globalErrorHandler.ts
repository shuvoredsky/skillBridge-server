import { NextFunction, Request, Response } from "express"
import { Prisma } from "../../generated/prisma/client";


function errorHandler (err:any, req:Request, res:Response, next: NextFunction){

    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    let errorDetails = err;

    if(err instanceof Prisma.PrismaClientValidationError){
        statusCode = 404;
        errorMessage = "You provide incorrect field type or missing fields"
        
    }
    else if(err instanceof Prisma.PrismaClientKnownRequestError){
        if(err.code === "P2025"){
            statusCode = 400;
            errorMessage: "An operation failed because it depends on one or more records that were"
        }
        else if(err.code === "P2002"){
            statusCode: 400;
            errorMessage: "Unique constraint failed on the "
        }
        else if(err.code === "P2003"){
            statusCode: 400;
            errorMessage = "Foreign key constraints failed"
        }
    }
    else if(err instanceof Prisma.PrismaClientUnknownRequestError){
        statusCode = 500;
        errorMessage = "Error Occurred during query execution"
    }
    else if(err instanceof Prisma.PrismaClientInitializationError){
        if(err.errorCode === "P1000"){
            statusCode = 401;
            errorMessage = "Authenticaion failed, Please check your credential"
        }
        else if(err.errorCode === "P1001"){
            statusCode = 400;
            errorMessage = "Can't reach database server"
        }
    }

    res.status(statusCode)
    res.json({
        message: errorMessage,
        error: errorDetails
    })
}


export default errorHandler;