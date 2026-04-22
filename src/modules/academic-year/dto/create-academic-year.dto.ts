import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty({
    description: 'Academic year in format YYYY-YY (e.g., 2025-26)',
    example: '2025-26',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Year must be in format YYYY-YY (e.g., 2025-26)',
  })
  year!: string;
}
