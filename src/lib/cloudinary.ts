import { v2 as cloudinary } from "cloudinary";

// Safely log configuration presence without leaking secrets
console.log("Cloudinary Config Loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "MISSING",
  api_key_configured: !!process.env.CLOUDINARY_API_KEY,
  api_secret_configured: !!process.env.CLOUDINARY_API_SECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a file buffer directly to Cloudinary using streaming.
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string,
  publicId: string,
  isProfilePhoto: boolean = false
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    // Hardening check for credentials before attempting upload
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return reject(
        new Error("Cloudinary upload failed: Missing environment credentials.")
      );
    }

    const uploadOptions: any = {
      folder: folder,
      public_id: publicId,
      overwrite: true,
      resource_type: "image", // Always images in this application
    };

    // Crop constraints for profile photos (incoming transformations to save storage size)
    if (isProfilePhoto) {
      uploadOptions.transformation = [
        { width: 500, height: 500, crop: "limit" }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload returned empty response"));
        }

        // Generate optimized delivery URL dynamically using f_auto and q_auto
        const optimizedUrl = cloudinary.url(result.public_id, {
          secure: true,
          fetch_format: "auto",
          quality: "auto",
          version: result.version,
        });

        resolve({
          secure_url: optimizedUrl,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an asset from Cloudinary by its public ID.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.warn("Skipping Cloudinary deletion check: Credentials missing.");
    return;
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deletion attempt for public ID: ${publicId}. Result:`, result);
  } catch (error) {
    console.error(`Failed to delete asset from Cloudinary for public ID ${publicId}:`, error);
  }
};
