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
    const feeStructure = await this.prisma.feeStructure.create({ data });

    // Auto-generate StudentFee records for all enrolled students in this class
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId: data.classId, endDate: null },
    });

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);

    for (const enrollment of enrollments) {
      await this.prisma.studentFee.create({
        data: {
          studentId: enrollment.studentId,
          feeStructureId: feeStructure.id,
          amount: feeStructure.amount,
          dueDate,
          paidAmount: 0,
          pendingAmount: feeStructure.amount,
          status: 'PENDING',
        },
      });
    }

    return feeStructure;
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
    return this.prisma.feeStructure.findMany({
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


  async getStudentFeesByStudent(studentId: string) {
    return this.prisma.studentFee.findMany({
      where: { studentId },
      include: {
        feeStructure: true,
        payments: true,
      },
    });
  }

  async createStudentFeesForClassStudents(classId: string, dueDate: string) {
    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { classId },
    });

    if (feeStructures.length === 0) {
      throw new NotFoundException(`No fee structures found for class ${classId}`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId, endDate: null },
      include: { student: true },
    });

    if (enrollments.length === 0) {
      throw new NotFoundException(`No enrolled students found for class ${classId}`);
    }

    const createdFees: any[] = [];

    for (const enrollment of enrollments) {
      for (const feeStructure of feeStructures) {
        const existing = await this.prisma.studentFee.findFirst({
          where: {
            studentId: enrollment.studentId,
            feeStructureId: feeStructure.id,
          },
        });

        if (!existing) {
          const fee = await this.prisma.studentFee.create({
            data: {
              studentId: enrollment.studentId,
              feeStructureId: feeStructure.id,
              amount: feeStructure.amount,
              dueDate: new Date(dueDate),
              paidAmount: 0,
              pendingAmount: feeStructure.amount,
              status: 'PENDING',
            },
          });
          createdFees.push(fee);
        }
      }
    }

    return {
      classId,
      studentsProcessed: enrollments.length,
      feeStructuresApplied: feeStructures.length,
      feesCreated: createdFees.length,
      fees: createdFees,
    };
  }

  async autoGenerateFeesForStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: { where: { endDate: null } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.enrollments.length === 0) {
      return {
        studentId,
        message: 'Student has no active enrollments',
        feesCreated: 0,
      };
    }

    const createdFees: any[] = [];

    for (const enrollment of student.enrollments) {
      const feeStructures = await this.prisma.feeStructure.findMany({
        where: { classId: enrollment.classId },
      });

      for (const feeStructure of feeStructures) {
        const existing = await this.prisma.studentFee.findFirst({
          where: {
            studentId,
            feeStructureId: feeStructure.id,
          },
        });

        if (!existing) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 1);

          const fee = await this.prisma.studentFee.create({
            data: {
              studentId,
              feeStructureId: feeStructure.id,
              amount: feeStructure.amount,
              dueDate,
              paidAmount: 0,
              pendingAmount: feeStructure.amount,
              status: 'PENDING',
            },
          });
          createdFees.push(fee);
        }
      }
    }

    return {
      studentId,
      enrollmentsProcessed: student.enrollments.length,
      feesCreated: createdFees.length,
      fees: createdFees,
    };
  }

  async getStudentEnrollmentStatus(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { endDate: null },
          include: {
            class: true,
          },
        },
        fees: {
          include: { feeStructure: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check FeeStructures in each class
    const enrollmentDetails = await Promise.all(
      student.enrollments.map(async (enrollment) => {
        const feeStructures = await this.prisma.feeStructure.findMany({
          where: { classId: enrollment.classId },
        });
        return {
          classId: enrollment.classId,
          className: enrollment.class.name,
          startDate: enrollment.startDate,
          feeStructureCount: feeStructures.length,
          feeStructures,
        };
      }),
    );

    return {
      studentId,
      studentName: student.id,
      activeEnrollments: student.enrollments.length,
      totalStudentFees: student.fees.length,
      enrollmentDetails,
      existingFees: student.fees.map((f) => ({
        id: f.id,
        title: f.feeStructure?.title,
        amount: f.amount,
        status: f.status,
      })),
    };
  }
}
