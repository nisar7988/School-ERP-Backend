import { Module } from '@nestjs/common';
import { ClassStaffService } from './class-staff.service';
import { ClassStaffController } from './class-staff.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassStaffController],
  providers: [ClassStaffService],
  exports: [ClassStaffService],
})
export class ClassStaffModule {}
