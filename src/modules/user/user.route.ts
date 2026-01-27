import express from "express"
import auth, { UserRole } from "../../middleware/auth"
import { UserController } from "./user.controller"

const router = express.Router()

router.get("/me",
    auth(UserRole.STUDENT, UserRole.ADMIN, UserRole.TUTOR), UserController.getMe
)

export const userRouter = router;