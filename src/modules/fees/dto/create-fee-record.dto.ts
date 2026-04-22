import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { FeeStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
export class CreateFeeRecordDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;
}