import { PartialType } from '@nestjs/mapped-types';
import { CreateClassDto } from './create-class.dto';
export class UpdateClassDto extends PartialType(CreateClassDto) {
  subjects?: string[]; // Array of subject IDs to assign to the class
}
