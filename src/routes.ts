import express from "express";
import { userRouter } from "./modules/user/user.route";
import { tutorRouter } from "./modules/tutor/tutor.route";



const router = express.Router();


router.use("/users", userRouter);
router.use("/tutors", tutorRouter);


export default router;
