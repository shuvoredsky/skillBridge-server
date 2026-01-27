import express from "express";
import { userRouter } from "./modules/user/user.route";
// future:
// import { tutorRouter } from "./modules/tutor/tutor.route";

const router = express.Router();


router.use("/users", userRouter);

// tutor routes (later)
// router.use("/tutors", tutorRouter);

export default router;
