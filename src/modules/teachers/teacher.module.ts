import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { ClassModule } from '../class/class.module';
import { ClaudinaryModule } from '../claudinary/claudinary.module';

@Module({
  imports: [ClassModule, ClaudinaryModule],
  providers: [TeacherService],
  controllers: [TeacherController]
})
export class TeacherModule {}
