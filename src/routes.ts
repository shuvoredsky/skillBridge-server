import express from "express";
import { userRouter } from "./modules/user/user.route";
import { tutorRouter } from "./modules/tutor/tutor.route";
import { categoryRouter } from "./modules/category/category.route";



const router = express.Router();


router.use("/users", userRouter);
router.use("/tutors", tutorRouter);
router.use("/categories", categoryRouter)


export default router;
