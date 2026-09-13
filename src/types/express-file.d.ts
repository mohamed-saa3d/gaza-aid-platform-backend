declare module 'multer';
declare module 'streamifier';
declare module 'redis';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      };
    }
  }
}

export {};
