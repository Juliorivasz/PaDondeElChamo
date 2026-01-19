import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(
    @Inject('CLOUDINARY') private cloudinary: typeof Cloudinary,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.upload_stream(
        { folder: 'pinkyhoops/productos' },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        },
      ).end(file.buffer);
    });
  }
}
