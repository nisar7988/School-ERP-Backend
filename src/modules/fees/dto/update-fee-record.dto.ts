import { CreateFeeRecordDto } from './create-fee-record.dto';
import { PartialType } from '@nestjs/swagger';
export class UpdateFeeRecordDto extends PartialType(CreateFeeRecordDto) {}