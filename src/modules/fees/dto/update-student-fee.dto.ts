import { PartialType } from '@nestjs/swagger';
import { CreateStudentFeeDto } from './create-student-fee.dto';

export class UpdateStudentFeeDto extends PartialType(CreateStudentFeeDto) {}
