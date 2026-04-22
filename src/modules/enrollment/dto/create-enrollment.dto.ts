import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
