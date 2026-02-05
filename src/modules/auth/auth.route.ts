import express from "express";
import { verifyEmail } from "./auth.controller";

const router = express.Router();

router.post("/email", verifyEmail);

export const authVerifyRouter = router;