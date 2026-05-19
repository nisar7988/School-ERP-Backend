import { IsDateString, IsEnum, IsArray, ValidateNested, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class StudentAttendanceDto {
  @ApiProperty({ description: 'The ID of the student', example: 'student123' })
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'The status of the attendance record', example: 'PRESENT', enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

export class CreateBulkAttendanceDto {
  @ApiProperty({ description: 'The date of the attendance', example: '2024-01-01' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'The ID of the class', example: 'class-uuid' })
  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({ description: 'List of student attendances', type: [StudentAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  records!: StudentAttendanceDto[];
}
