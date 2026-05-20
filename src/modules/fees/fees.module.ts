import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [FeesService],
  controllers: [FeesController],
  exports: [FeesService],
})
export class FeesModule {}
