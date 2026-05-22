import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    try {
      //check if env is prest or not
      if (!process.env.CLAUDINARY_NAME) {
        throw new Error('CLAUDINARY not configured in .env file');
      }
      if (!process.env.CLAUDINARY_API_KEY) {
        throw new Error('CLAUDINARY_API_KEY not configured in .env file');
      }
      if (!process.env.CLAUDINARY_API_SECRET) {
        throw new Error('CLAUDINARY_API_SECRET not configured in .env file');
      }
      return cloudinary.config({
        cloud_name: process.env.CLAUDINARY_NAME,
        api_key: process.env.CLAUDINARY_API_KEY,
        api_secret: process.env.CLAUDINARY_API_SECRET,
      });
    } catch (error) {
      console.error('Cloudinary configuration error: ', error);
    }
  },
};
