import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { UpdateStudentFeeDto } from './dto/update-student-fee.dto';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  //admin add fee for class
  async createFeeForClass(data: CreateFeeStructureDto) {
    return this.prisma.feeStructure.create({ data });
  }

  //admin edit fee for class
  async updateFeeForClass(id: string, data: Partial<CreateFeeStructureDto>) {
    return this.prisma.feeStructure.update({
      where: { id },
      data,
    });
  }

  //admin can delete fee structure for a class
  async deleteFeeStructureForClass(id: string) {
    return this.prisma.feeStructure.delete({
      where: { id },
    });
  }

  //admin & teacher can view fee structure for all classes
  async getAllFeeStructures() {
    return this.prisma.feeStructure.findMany();
  }

  //admin & teacher can view fee structure for a class
  async getFeeStructureForClass(classId: string) {
    return this.prisma.feeStructure.findFirst({
      where: { classId },
    });
  }

  //pending student fee records class wise
  async getPendingFeesForClass(classId: string) {
    return this.prisma.studentFee.findMany({
      where: {
        status: 'PENDING',
        student: {
          enrollments: {
            some: {
              classId,
            },
          },
        },
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });
  }

  async createStudentFee(data: CreateStudentFeeDto) {
    return this.prisma.studentFee.create({
      data: {
        ...data,
        paidAmount: 0,
        pendingAmount: data.amount,
        status: data.status ?? 'PENDING',
      },
    });
  }

  async updateStudentFee(id: string, data: UpdateStudentFeeDto) {
    const existing = await this.prisma.studentFee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Student fee record not found');
    }

    const updatedData: any = { ...data };
    if (data.amount !== undefined) {
      const paidAmount = Number(existing.paidAmount ?? 0);
      const pendingAmount = Number(data.amount) - paidAmount;
      updatedData.pendingAmount = pendingAmount >= 0 ? pendingAmount : 0;
    }

    return this.prisma.studentFee.update({
      where: { id },
      data: updatedData,
    });
  }

  async deleteStudentFee(id: string) {
    return this.prisma.studentFee.delete({
      where: { id },
    });
  }

  async getAllStudentFees() {
    return this.prisma.studentFee.findMany({
      include: {
        student: true,
        feeStructure: true,
        payments: true,
      },
    });
  }

  async getStudentFeeById(id: string) {
    return this.prisma.studentFee.findUnique({
      where: { id },
      include: {
        student: true,
        feeStructure: true,
        payments: true,
      },
    });
  }

  async getStudentFeesByStudent(studentId: string) {
    return this.prisma.studentFee.findMany({
      where: { studentId },
      include: {
        feeStructure: true,
        payments: true,
      },
    });
  }

  async getStudentFeeDetails(studentId: string) {
    return this.getStudentFeesByStudent(studentId);
  }
}
