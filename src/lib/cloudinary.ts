import { v2 as cloudinary } from "cloudinary";

/**
 * Resolves Cloudinary credentials from environment variables with fallback to common casing conventions.
 */
export const getCloudinaryCredentials = () => {
  const cloud_name =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.Cloude_Name ||
    process.env.Cloud_Name ||
    process.env.CLOUDE_NAME ||
    process.env.CLOUDINARY_NAME;

  const api_key =
    process.env.CLOUDINARY_API_KEY ||
    process.env.Cloudinary_Api_Key ||
    process.env.CLOUDINARY_KEY;

  const api_secret =
    process.env.CLOUDINARY_API_SECRET ||
    process.env.Cloudinary_APi_Secret ||
    process.env.Cloudinary_Api_Secret ||
    process.env.CLOUDINARY_SECRET;

  return { cloud_name, api_key, api_secret };
};

// Initial config attempt
const initCredentials = getCloudinaryCredentials();
if (initCredentials.cloud_name && initCredentials.api_key && initCredentials.api_secret) {
  cloudinary.config({
    cloud_name: initCredentials.cloud_name,
    api_key: initCredentials.api_key,
    api_secret: initCredentials.api_secret,
  });
}

// Safely log configuration presence without leaking secrets
console.log("Cloudinary Config Loaded:", {
  cloud_name: initCredentials.cloud_name || "MISSING",
  api_key_configured: !!initCredentials.api_key,
  api_secret_configured: !!initCredentials.api_secret,
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
    const { cloud_name, api_key, api_secret } = getCloudinaryCredentials();

    // Hardening check for credentials before attempting upload
    if (!cloud_name || !api_key || !api_secret) {
      return reject(
        new Error("Cloudinary upload failed: Missing environment credentials.")
      );
    }

    // Ensure Cloudinary is configured with resolved credentials
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
    });

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
  const { cloud_name, api_key, api_secret } = getCloudinaryCredentials();

  if (!cloud_name || !api_key || !api_secret) {
    console.warn("Skipping Cloudinary deletion check: Credentials missing.");
    return;
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
  });

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deletion attempt for public ID: ${publicId}. Result:`, result);
  } catch (error) {
    console.error(`Failed to delete asset from Cloudinary for public ID ${publicId}:`, error);
  }
};
