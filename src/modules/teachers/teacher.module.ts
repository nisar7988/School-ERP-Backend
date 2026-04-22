import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [ClassModule],
  providers: [TeacherService],
  controllers: [TeacherController]
})
export class TeacherModule {}
