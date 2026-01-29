import express from "express";
import { userRouter } from "./modules/user/user.route";
import { tutorRouter } from "./modules/tutor/tutor.route";
import { categoryRouter } from "./modules/category/category.route";
import { availabilityRouter } from "./modules/availability/availability.route";



const router = express.Router();


router.use("/users", userRouter);
router.use("/tutors", tutorRouter);
router.use("/categories", categoryRouter)
router.use("/availability", availabilityRouter)


export default router;
