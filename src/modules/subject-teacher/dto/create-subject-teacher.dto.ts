import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectTeacherDto {
  @ApiProperty({
    description: 'The ID of the subject',
    example: 'subject123',
  })
  @IsUUID()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({
    description: 'The ID of the teacher',
    example: 'teacher123',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId!: string;
}
