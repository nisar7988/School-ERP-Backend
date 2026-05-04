import { BaseQueryDto } from '../../../common/dto/query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceQueryDto extends BaseQueryDto {

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: '2023-09' })
  @IsOptional()
  @IsString()
  month ?: string;

}