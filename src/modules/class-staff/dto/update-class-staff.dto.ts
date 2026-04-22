import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClassRole } from '@prisma/client';

export class UpdateClassStaffDto {
  @ApiProperty({
    description: 'The role of the teacher in the class',
    enum: ['INCHARGE', 'SUBJECT_TEACHER'],
    example: 'SUBJECT_TEACHER',
    required: false,
  })
  @IsEnum(['INCHARGE', 'SUBJECT_TEACHER'])
  @IsOptional()
  role?: ClassRole;
}
