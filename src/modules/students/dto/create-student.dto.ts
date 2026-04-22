import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string; 
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  admissionNo!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rollNo?: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth!: Date;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'password123',
    description:
      'The password for the student account. If not provided, a random password will be generated and returned in the response.',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
