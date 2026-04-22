import { IsDateString, IsEnum, IsOptional, IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
export class CreateAttendanceDto {
  @ApiProperty({ description: 'The date of the attendance record', example: '2024-01-01' })
  @IsDateString()
  date!: string;

@ApiProperty({
  description: 'The status of the attendance record',
  example: 'PRESENT',
  enum: AttendanceStatus
})
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiProperty({ description: 'Any additional remarks about the attendance record', example: 'Student was present for the entire class' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ description: 'The ID of the student associated with the attendance record', example: 'student123' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'The ID of the class for attendance', example: 'class123' })
  @IsUUID()
  @IsNotEmpty()
  classId!: string;
}