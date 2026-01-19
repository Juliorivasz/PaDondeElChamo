import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryProvider } from './cloudinary.config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: require('multer').memoryStorage(),
    }),
  ],
  providers: [CloudinaryProvider, UploadService],
  controllers: [UploadController],
  exports: ['CLOUDINARY', UploadService],
})
export class CloudinaryModule {}
