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
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);
    const total = await this.prisma.payment.count();
    const payments = await this.prisma.payment.findMany({
      skip,
      take,
    });

    return createPaginatedResponse(payments, total, page, limit);
  }

  async recordPayment(dto: CreatePaymentDto) {
    const { studentFeeId, amount, paidAt, method, referenceNo } = dto;

    const studentFee = await this.prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: {
        payments: true,
        student: { include: { user: true } },
        feeStructure: true,
      },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const pendingAmount = Number(studentFee.pendingAmount ?? studentFee.amount ?? 0);
    if (amount > pendingAmount) {
      throw new BadRequestException(
        `Payment amount ${amount} exceeds remaining amount ${pendingAmount}`,
      );
    }

    const paidAmount = Number(studentFee.paidAmount ?? 0);
    const newPaidAmount = paidAmount + amount;
    const newPendingAmount = pendingAmount - amount;
    const newStatus: FeeStatus =
      newPendingAmount <= 0
        ? FeeStatus.PAID
        : newPaidAmount > 0
          ? FeeStatus.PARTIAL
          : FeeStatus.PENDING;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentFeeId,
          amount,
          method,
          referenceNo,
          paidAt: paidAt ? new Date(paidAt) : undefined,
        },
      });

      await tx.studentFee.update({
        where: { id: studentFeeId },
        data: {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount >= 0 ? newPendingAmount : 0,
          status: newStatus,
        },
      });

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

  async getPaymentsByStudentFee(studentFeeId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    const studentFee = await this.prisma.studentFee.findUnique({
      where: { id: studentFeeId },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take,
        where: { studentFeeId },
        include: {
          studentFee: {
            include: { student: { include: { user: true } }, feeStructure: true },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { studentFeeId } }),
    ]);

    return createPaginatedResponse(payments, total, page, limit);
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

  async getPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        studentFee: {
          include: { student: { include: { user: true } }, feeStructure: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
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
      include: {
        studentFee: {
          include: { payments: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const studentFee = payment.studentFee;
    if (!studentFee) {
      throw new NotFoundException('Related student fee record not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      const remainingPayments = studentFee.payments.filter((p) => p.id !== id);
      const totalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const feeAmount = Number(studentFee.amount);
      const newPendingAmount = feeAmount - totalPaid;

      let newStatus: FeeStatus = FeeStatus.PENDING;
      if (totalPaid >= feeAmount) {
        newStatus = FeeStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = FeeStatus.PARTIAL;
      }

      return tx.studentFee.update({
        where: { id: studentFee.id },
        data: {
          paidAmount: totalPaid,
          pendingAmount: newPendingAmount >= 0 ? newPendingAmount : 0,
          status: newStatus,
        },
      });
    });
  }
}
