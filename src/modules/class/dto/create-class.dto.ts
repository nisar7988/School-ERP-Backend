import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassRole } from '@prisma/client';

class StaffDto {
  @ApiProperty({
    example: 'teacher-uuid',
  })
  @IsUUID()
  teacherId!: string;

  @ApiProperty({
    enum: ClassRole,
    example: ClassRole.INCHARGE,
  })
  @IsEnum(ClassRole)
  role!: ClassRole;
}

export class CreateClassDto {
  @ApiProperty({
    description: 'The name of the class',
    example: 'Class 10',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'The section of the class',
    example: 'A',
  })
  @IsString()
  @IsNotEmpty()
  section!: string;

  @ApiPropertyOptional({
    description: 'Academic year ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  academicYearId?: string;

  // 👇 NEW FIELD
  @ApiPropertyOptional({
    description: 'Assign teachers to class',
    type: [StaffDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffDto)
  @IsOptional()
  staff?: StaffDto[];
}