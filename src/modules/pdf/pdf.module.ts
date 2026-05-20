import { Module } from '@nestjs/common';
import { FeesPdfService } from './pdf.service';

@Module({
  providers: [FeesPdfService],
  exports: [FeesPdfService],
})
export class PdfModule {}
