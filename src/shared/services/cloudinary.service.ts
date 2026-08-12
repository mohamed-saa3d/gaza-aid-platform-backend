import { cloudinary } from '../../config/cloudinary.config';
const streamifier = require('streamifier');

export const cloudinaryService = {
  uploadImageStream: (fileBuffer: Buffer, folderName = 'qaza/projects') => {
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folderName, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No result from Cloudinary')); 

          resolve({ secure_url: result.secure_url as string, public_id: result.public_id as string });
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  },

  deleteImage: async (publicId: string) => {
    if (!publicId) return null;
    return cloudinary.uploader.destroy(publicId);
  },

  extractPublicIdFromUrl: (url: string): string | null => {
    if (!url) return null;
    // Cloudinary URLs generally contain /v<version>/<public_id>.<ext>
    const match = url.match(/\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
    if (!match) return null;
    return match[1];
  },
};
