import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { uploadSingle } from "../../config/multer";
import { SettingsController } from "./settings.controller";

const router = express.Router();

router.get("/", SettingsController.getSiteSettings);
router.post(
  "/logo",
  auth(UserRole.ADMIN),
  uploadSingle("site", "logo"),
  SettingsController.uploadLogo
);

export const settingsRouter = router;
