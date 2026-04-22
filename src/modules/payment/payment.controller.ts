import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async recordPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentService.recordPayment(dto);
  }

  @Get('fee/:feeId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getPaymentsByFee(
    @Param('feeId') feeId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.paymentService.getPaymentsByFee(feeId, query);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getPaymentsByStudent(
    @Param('studentId') studentId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.paymentService.getPaymentsByStudent(studentId, query);
  }

  @Get('student/:studentId/summary')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getStudentFeesSummary(@Param('studentId') studentId: string) {
    return this.paymentService.getStudentFeesSummary(studentId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getPaymentById(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deletePayment(@Param('id') id: string) {
    return this.paymentService.deletePayment(id);
  }
}
