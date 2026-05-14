import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';
import { PaymentMethod, FeeStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPayments(query: BaseQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const { skip, take } = buildPagination(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { studentFee: { student: { user: { firstName: { contains: search, mode: 'insensitive' } } } } },
        { studentFee: { student: { user: { lastName: { contains: search, mode: 'insensitive' } } } } },
        { studentFee: { student: { admissionNo: { contains: search, mode: 'insensitive' } } } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take,
        where,
        include: {
          studentFee: {
            include: { student: { include: { user: true } }, feeStructure: true },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return createPaginatedResponse(payments, total, page, limit);
  }

  async recordPayment(dto: CreatePaymentDto) {
    const { studentFeeId, amount, paidAt, method, referenceNo } = dto;

    const studentFee = await this.prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: {
        payments: true,
      },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    const paymentAmount = new Decimal(amount);
    if (paymentAmount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const currentPending = new Decimal(studentFee.pendingAmount.toString());
    if (paymentAmount.greaterThan(currentPending)) {
      throw new BadRequestException(
        `Payment amount ${paymentAmount} exceeds remaining amount ${currentPending}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentFeeId,
          amount: paymentAmount,
          method,
          referenceNo,
          paidAt: paidAt ? new Date(paidAt) : undefined,
        },
      });

      await this.syncStudentFee(studentFeeId, tx);

      return tx.payment.findUnique({
        where: { id: payment.id },
        include: {
          studentFee: {
            include: {
              student: { include: { user: true } },
              feeStructure: true,
            },
          },
        },
      });
    });
  }

  /**
   * Recalculates and synchronizes the paidAmount, pendingAmount, and status of a StudentFee record.
   * This ensures data integrity by deriving balances from the source of truth (Payments).
   */
  private async syncStudentFee(studentFeeId: string, tx: any) {
    const fee = await tx.studentFee.findUnique({
      where: { id: studentFeeId },
      include: { payments: true },
    });

    if (!fee) return;

    const totalPaid = fee.payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );
    const totalAmount = new Decimal(fee.amount.toString());
    const pendingAmount = totalAmount.minus(totalPaid);

    let status: FeeStatus = FeeStatus.PENDING;
    if (totalPaid.greaterThanOrEqualTo(totalAmount)) {
      status = FeeStatus.PAID;
    } else if (totalPaid.greaterThan(0)) {
      status = FeeStatus.PARTIAL;
    }

    await tx.studentFee.update({
      where: { id: studentFeeId },
      data: {
        paidAmount: totalPaid,
        pendingAmount: pendingAmount.greaterThan(0) ? pendingAmount : new Decimal(0),
        status: status,
      },
    });
  }


  async getPaymentsByStudent(studentId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take,
        where: { studentFee: { studentId } },
        include: {
          studentFee: {
            include: { student: { include: { user: true } }, feeStructure: true },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { studentFee: { studentId } } }),
    ]);

    return createPaginatedResponse(payments, total, page, limit);
  }


  async getStudentFeesSummary(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        fees: {
          include: { payments: true, feeStructure: true },
        },
        enrollments: { include: { class: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }
    const classId: string | null =
      student.enrollments.length > 0 ? student.enrollments[0].classId : null;
    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { classId: classId && classId !== null ? classId : undefined },
    });

    const totalFees = feeStructures.reduce((sum, fs) => sum.plus(fs.amount), new Decimal(0));
    // Calculate totals from actual StudentFee records (auto-generated from FeeStructures)
    const summary = {
      studentId,
      studentName: student.user?.firstName
        ? `${student.user.firstName} ${student.user.lastName}`
        : student.id,
      totalFees,
      totalPaid: student.fees.reduce((sum, fee) => sum.plus(fee.paidAmount ?? 0), new Decimal(0)),
      totalDue: student.fees.reduce((sum, fee) => sum.plus(fee.pendingAmount ?? 0), new Decimal(0)),
      remainingAmount: totalFees.minus(
        student.fees.reduce((sum, fee) => sum.plus(fee.paidAmount ?? 0), new Decimal(0)),
      ),
      feeDetails: student.fees.map((fee) => ({
        feeId: fee.id,
        classId: fee.feeStructure?.classId,
        className: fee.feeStructure?.classId
          ? student.enrollments.find(
              (enrollment) => enrollment.classId === fee.feeStructure?.classId,
            )?.class.name
          : null,
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        pendingAmount: fee.pendingAmount,
        status: fee.status,
        dueDate: fee.dueDate,
        payments: fee.payments.map((payment) => ({
          paymentId: payment.id,
          amount: payment.amount,
          method: payment.method,
          paidAt: payment.paidAt,
          referenceNo: payment.referenceNo,
        })),
      })),
    };

    return summary;
  }

  async deletePayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });
      await this.syncStudentFee(payment.studentFeeId, tx);
      return { message: 'Payment deleted successfully' };
    });
  }
}
