import express from "express"
import auth, { UserRole } from "../../middleware/auth"
import { UserController } from "./user.controller"
import { uploadSingle } from "../../config/multer"

const router = express.Router()

router.get("/me",
    auth(UserRole.STUDENT, UserRole.ADMIN, UserRole.TUTOR), UserController.getMe
)

router.post("/:id/upload-photo",
    uploadSingle("students", "photo"),
    UserController.uploadPhoto
)

export const userRouter = router;