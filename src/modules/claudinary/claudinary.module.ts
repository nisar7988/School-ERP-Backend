import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './claudinary.provider';
import { CloudinaryService } from './claudinary.service';

@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class ClaudinaryModule {}
