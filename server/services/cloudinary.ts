import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL?.split('@')[1]?.split('/')[0],
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL?.split('://')[1]?.split(':')[0],
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_URL?.split(':')[2]?.split('@')[0],
});

// Multer configuration for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, SVG, and WebP are allowed."));
    }
  },
});

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

class CloudinaryService {
  async uploadImage(
    fileBuffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any;
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder || "elite-scholar/logos",
            public_id: options.public_id,
            transformation: options.transformation || {
              width: 200,
              height: 200,
              crop: "limit",
              quality: "auto",
              format: "auto",
            },
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryUploadResult);
            }
          }
        );

        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error}`);
    }
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false;
    }
  }

  generateTransformationUrl(
    publicId: string,
    transformations: any
  ): string {
    return cloudinary.url(publicId, transformations);
  }
}

export const cloudinaryService = new CloudinaryService();
