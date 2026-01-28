import express from "express"
import { TutorController } from "./tutor.controller";
import auth, { UserRole } from "../../middleware/auth";


const router = express.Router();

router.get("/", TutorController.getAllTutors);

router.post("/", 
    auth(UserRole.STUDENT, UserRole.ADMIN),
    TutorController.createTutorProfile
)

router.get("/me", auth(UserRole.TUTOR, UserRole.ADMIN),
        TutorController.getMyTutorProfile
)

export const tutorRouter = router;