import { IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClassRole } from '@prisma/client';

export class CreateClassStaffDto {
  @ApiProperty({
    description: 'The ID of the class',
    example: 'class123',
  })
  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({
    description: 'The ID of the teacher',
    example: 'teacher123',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId!: string;

  @ApiProperty({
    description: 'The role of the teacher in the class',
    enum: ['INCHARGE', 'SUBJECT_TEACHER'],
    example: 'INCHARGE',
  })
  @IsEnum(['INCHARGE', 'SUBJECT_TEACHER'])
  @IsNotEmpty()
  role!: ClassRole;
}
