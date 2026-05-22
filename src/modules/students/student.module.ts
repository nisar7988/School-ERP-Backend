import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { FeesModule } from '../fees/fees.module';
import { ClaudinaryModule } from '../claudinary/claudinary.module';

@Module({
  imports: [FeesModule, ClaudinaryModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
