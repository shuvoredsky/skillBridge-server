import { v2 as cloudinary } from "cloudinary";

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
  publicId?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload returned empty response"));
        }
        resolve({
          secure_url: result.secure_url,
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
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deletion attempt for public ID: ${publicId}. Result:`, result);
  } catch (error) {
    console.error(`Failed to delete asset from Cloudinary for public ID ${publicId}:`, error);
  }
};
