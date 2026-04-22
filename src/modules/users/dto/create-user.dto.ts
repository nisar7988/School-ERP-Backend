import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @ApiProperty({ example: 'password123' })
  password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '+1234567890' })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
 @ApiProperty({ enum: ['Student', 'User']})
  role?: UserRole; // default = STUDENT from schema
}