import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import { storage } from '../storage';

export class CloudinaryService {
  private isConfigured = false;

  async configure(config?: { cloudName: string; apiKey: string; apiSecret: string }) {
    try {
      let cloudinaryConfig: ConfigOptions;

      if (config) {
        cloudinaryConfig = {
          cloud_name: config.cloudName,
          api_key: config.apiKey,
          api_secret: config.apiSecret,
        };
      } else {
        // Get config from app settings
        const appConfig = await storage.getAppConfig();
        if (!appConfig?.cloudinaryCloudName || !appConfig?.cloudinaryApiKey || !appConfig?.cloudinaryApiSecret) {
          throw new Error('Cloudinary configuration is incomplete');
        }

        cloudinaryConfig = {
          cloud_name: appConfig.cloudinaryCloudName,
          api_key: appConfig.cloudinaryApiKey,
          api_secret: appConfig.cloudinaryApiSecret,
        };
      }

      cloudinary.config(cloudinaryConfig);
      this.isConfigured = true;
      
      // Test connection
      await cloudinary.api.ping();
      await storage.updateServiceStatus('cloudinary', 'connected');
      
      return true;
    } catch (error) {
      this.isConfigured = false;
      const message = error instanceof Error ? error.message : 'Configuration failed';
      await storage.updateServiceStatus('cloudinary', 'error', message);
      throw error;
    }
  }

  async uploadImage(
    file: Buffer | string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    } = {}
  ) {
    if (!this.isConfigured) {
      await this.configure();
    }

    try {
      const uploadOptions: any = {
        folder: options.folder || 'elite-scholar',
        resource_type: options.resourceType || 'image',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      if (options.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      let result;
      if (typeof file === 'string') {
        // File path or base64 string
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        // Buffer - convert to base64
        const base64String = `data:image/jpeg;base64,${file.toString('base64')}`;
        result = await cloudinary.uploader.upload(base64String, uploadOptions);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      await storage.updateServiceStatus('cloudinary', 'error', message);
      throw error;
    }
  }

  async uploadInvoiceAsset(
    file: Buffer | string,
    type: 'logo' | 'watermark' | 'background',
    schoolId?: string
  ) {
    const folder = schoolId ? `elite-scholar/schools/${schoolId}/invoices` : 'elite-scholar/system/invoices';
    
    const transformation: any = {};
    
    // Apply type-specific transformations
    switch (type) {
      case 'logo':
        transformation.width = 200;
        transformation.height = 100;
        transformation.crop = 'fit';
        transformation.quality = 'auto:good';
        break;
      case 'watermark':
        transformation.width = 300;
        transformation.height = 300;
        transformation.crop = 'fit';
        transformation.opacity = 30;
        transformation.quality = 'auto:low';
        break;
      case 'background':
        transformation.width = 800;
        transformation.height = 1000;
        transformation.crop = 'fill';
        transformation.quality = 'auto:good';
        break;
    }

    return await this.uploadImage(file, {
      folder,
      publicId: `${type}_${Date.now()}`,
      transformation,
    });
  }

  async deleteAsset(publicId: string) {
    if (!this.isConfigured) {
      await this.configure();
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      await storage.updateServiceStatus('cloudinary', 'error', message);
      throw error;
    }
  }

  async getSignedUrl(publicId: string, options: any = {}) {
    if (!this.isConfigured) {
      await this.configure();
    }

    try {
      return cloudinary.url(publicId, {
        sign_url: true,
        ...options,
      });
    } catch (error) {
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.configure();
      const result = await cloudinary.api.ping();
      return result.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  isReady() {
    return this.isConfigured;
  }
}

export const cloudinaryService = new CloudinaryService();