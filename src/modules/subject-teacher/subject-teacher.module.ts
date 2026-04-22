import { Module } from '@nestjs/common';
import { SubjectTeacherService } from './subject-teacher.service';
import { SubjectTeacherController } from './subject-teacher.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectTeacherController],
  providers: [SubjectTeacherService],
  exports: [SubjectTeacherService],
})
export class SubjectTeacherModule {}
