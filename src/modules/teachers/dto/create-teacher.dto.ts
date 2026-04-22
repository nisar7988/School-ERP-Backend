import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
export class CreateTeacherDto {
  @ApiProperty({ example: 'Nisar' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'nisar@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '7988828048', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'EMP123' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: 'BCA' })
  @IsString()
  @IsNotEmpty()
  qualification!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;
}