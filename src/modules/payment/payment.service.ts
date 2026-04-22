import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';
import Decimal from 'decimal.js';
@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async recordPayment(dto: CreatePaymentDto) {
    const { feeId, amount, paidAt } = dto;

    // Verify fee exists
    const fee = await this.prisma.feeRecord.findUnique({
      where: { id: feeId },
      include: { payments: true },
    });

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    // Calculate total paid
    const totalPaid = fee.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const remainingAmount = Number(fee.amount) - totalPaid;

    if (amount > remainingAmount) {
      throw new BadRequestException(
        `Payment amount ${amount} exceeds remaining amount ${remainingAmount}`,
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    // Record payment in transaction
    return this.prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          feeId,
          amount: amount,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      });

      // Update fee status based on payment
      const newTotalPaid = totalPaid + amount;
      const feeAmount = Number(fee.amount);
      let newStatus = fee.status;

      if (newTotalPaid >= feeAmount) {
        newStatus = 'PAID';
      } else if (newTotalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.feeRecord.update({
        where: { id: feeId },
        data: { status: newStatus },
      });

      return tx.payment.findUnique({
        where: { id: payment.id },
        include: {
          fee: {
            include: { student: { include: { user: true } } },
          },
        },
      });
    });
  }

  async getPaymentsByFee(feeId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify fee exists
    const fee = await this.prisma.feeRecord.findUnique({
      where: { id: feeId },
    });

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take,
        where: { feeId },
        include: {
          fee: {
            include: { student: { include: { user: true } } },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { feeId } }),
    ]);

    return createPaginatedResponse(payments, total, page, limit);
  }

  async getPaymentsByStudent(studentId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take,
        where: { fee: { studentId } },
        include: {
          fee: {
            include: { student: { include: { user: true } } },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { fee: { studentId } } }),
    ]);

    return createPaginatedResponse(payments, total, page, limit);
  }

  async getPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        fee: {
          include: { student: { include: { user: true } } },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getStudentFeesSummary(studentId: string) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        fees: {
          include: { payments: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const summary = {
      studentId,
      studentName: student.id,
      totalFees: new Decimal(0),
      totalPaid: new Decimal(0),
      totalDue: new Decimal(0),
      feesByStatus: {
        PAID: 0,
        PENDING: 0,
        PARTIAL: 0,
        OVERDUE: 0,
      },
      fees: student.fees.map((fee) => {
        const totalPaid = fee.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        return {
          id: fee.id,
          title: fee.title,
          amount: fee.amount,
          dueDate: fee.dueDate,
          status: fee.status,
          totalPaid: new Decimal(totalPaid),
          remaining: new Decimal(Number(fee.amount) - totalPaid),
        };
      }),
    };

    // Calculate totals
    summary.fees.forEach((fee) => {
      summary.totalFees = summary.totalFees.plus(fee.amount);
      summary.totalPaid = summary.totalPaid.plus(fee.totalPaid);
      summary.totalDue = summary.totalDue.plus(fee.remaining);
      summary.feesByStatus[fee.status]++;
    });

    return summary;
  }

  async deletePayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { fee: { include: { payments: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete payment
      await tx.payment.delete({
        where: { id },
      });

      // Recalculate fee status
      const remainingPayments = payment.fee.payments.filter(
        (p) => p.id !== id,
      );
      const totalPaid = remainingPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const feeAmount = Number(payment.fee.amount);

      let newStatus = payment.fee.status;
      if (totalPaid >= feeAmount) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'PENDING';
      }

      return tx.feeRecord.update({
        where: { id: payment.feeId },
        data: { status: newStatus },
      });
    });
  }
}
