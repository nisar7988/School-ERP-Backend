import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { AcademicYearModule } from '../academic-year/academic-year.module';

@Module({
  imports: [AcademicYearModule],
  providers: [ClassService],
  controllers: [ClassController],
  exports: [ClassService],
})
export class ClassModule {}
