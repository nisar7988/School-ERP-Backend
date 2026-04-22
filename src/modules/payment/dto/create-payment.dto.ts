import { IsNotEmpty, IsUUID, IsDecimal, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The ID of the fee record',
    example: 'fee123',
  })
  @IsUUID()
  @IsNotEmpty()
  feeId!: string;

  @ApiProperty({
    description: 'Amount paid (must not exceed remaining amount)',
    example: '5000.00',
  })
  @IsDecimal({ decimal_digits: '1,2' })
  @Type(() => Number)
  @IsNotEmpty()
  amount!: number;

  @ApiPropertyOptional({
    description: 'Optional payment date (defaults to now)',
    example: '2026-04-21',
  })
  @IsDateString()
  @IsNotEmpty()
  paidAt?: string;
}
