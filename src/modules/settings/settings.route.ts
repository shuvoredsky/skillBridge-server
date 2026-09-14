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
router.post(
  "/banner",
  auth(UserRole.ADMIN),
  uploadSingle("site", "banner"),
  SettingsController.uploadBanner
);
router.patch(
  "/text",
  auth(UserRole.ADMIN),
  SettingsController.updateTextSettings
);

export const settingsRouter = router;
