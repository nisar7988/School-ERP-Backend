import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'The ID of the class',
    example: 'class123',
  })
  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({
    description: 'The ID of the subject',
    example: 'subject123',
  })
  @IsUUID()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({
    description: 'The start time of the schedule',
    example: '2023-01-01T08:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  startTime!: Date;

  @ApiProperty({
    description: 'The end time of the schedule',
    example: '2023-01-01T09:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  endTime!: Date;

  @ApiPropertyOptional({
    description: 'The room for the schedule',
    example: '12',
  })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({
    description: 'The day of the week for the schedule',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({
    description: 'The ID of the teacher',
    example: 'teacher123',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId!: string;
}
