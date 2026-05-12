import { IsNotEmpty, IsUUID, IsNumber, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The ID of the student fee record',
    example: 'student-fee-id',
  })
  @IsUUID()
  @IsNotEmpty()
  studentFeeId!: string;

  @ApiProperty({
    description: 'Amount paid (must not exceed remaining amount)',
    example: 5000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Payment method used for the transaction',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Optional payment reference number',
    example: 'REF12345',
  })
  @IsOptional()
  @IsNotEmpty()
  referenceNo?: string;

  @ApiPropertyOptional({
    description: 'Optional payment date (defaults to now)',
    example: '2026-04-21T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
