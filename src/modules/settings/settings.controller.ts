import { Request, Response, NextFunction } from "express";
import { SettingsService } from "./settings.service";
import { uploadToCloudinary, deleteFromCloudinary } from "../../lib/cloudinary";

const getSiteSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await SettingsService.getSiteSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No logo file provided or invalid file format.",
      });
    }

    const currentSettings = await SettingsService.getSiteSettings();

    // Delete previous logo from Cloudinary if one exists
    if (currentSettings.logoPublicId) {
      await deleteFromCloudinary(currentSettings.logoPublicId);
    }

    const timestamp = Date.now();
    const publicId = `site_logo_${timestamp}`;

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "skillbridge/site/logo",
      publicId,
      false
    );

    const updatedSettings = await SettingsService.updateSiteLogo(
      uploadResult.secure_url,
      uploadResult.public_id
    );

    res.status(200).json({
      success: true,
      message: "Site logo updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
};

export const SettingsController = {
  getSiteSettings,
  uploadLogo,
};
