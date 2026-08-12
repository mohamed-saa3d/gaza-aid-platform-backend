const multer = require('multer');
import type { RequestHandler } from 'express';

const storage = multer.memoryStorage();

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req: any, file: any, cb: any) => {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp)'));
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

export const uploadSingleImage = (fieldName: string): RequestHandler => {
  const uploader = multer({ storage, fileFilter, limits }).single(fieldName);
  return (req, res, next) => uploader(req, res, (err: any) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
};
