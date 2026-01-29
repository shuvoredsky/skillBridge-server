import express from "express"
import auth, { UserRole } from "../../middleware/auth"
import { AvailabilityController } from "./availability.controller"


const router = express.Router()


router.post("/", auth(UserRole.TUTOR), AvailabilityController.createAvailability);

router.put("/:id", auth(UserRole.TUTOR),
AvailabilityController.updateAvailability)

router.delete("/:id", auth(UserRole.TUTOR),
AvailabilityController.deleteAvailability)

router.get("/:tutorId", AvailabilityController.getTutorAvailability)



export const availabilityRouter = router;