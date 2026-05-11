import { CreateSubjectDto } from './create-subject.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
