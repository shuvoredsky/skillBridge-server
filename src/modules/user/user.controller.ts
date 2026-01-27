import {NextFunction, Request, Response} from "express"
import { UserService } from "../user/user.service";

const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const user = req.user;

        if(!user){
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const result = await UserService.getMe(user.id);
        res.status(200).json(result);
    } catch(error){
        next(error)
    }
}


export const UserController = {
    getMe
}