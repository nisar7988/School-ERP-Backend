import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async enrollStudent(dto: CreateEnrollmentDto) {
    const { studentId, classId, startDate, endDate } = dto;

    // Verify student and class exist
    const [student, schoolClass] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: studentId } }),
      this.prisma.schoolClass.findUnique({ where: { id: classId } }),
    ]);

    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId,
          classId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
        },
        include: {
          student: {
            include: { user: true },
          },
          class: {
            include: { academicYear: true },
          },
        },
      });

      // Auto-generate StudentFee records for all existing FeeStructures in this class
      const feeStructures = await this.prisma.feeStructure.findMany({
        where: { classId },
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

          await this.prisma.studentFee.create({
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
        }
      }

      return enrollment;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Student already enrolled in this class');
      }
      throw error;
    }
  }

  async getEnrollments(query: BaseQueryDto) {
    const { page = 1, limit = 10, classId, search } = query;
    const { skip, take } = buildPagination(page, limit);

    const where: any = {};

    if (classId) {
      where.classId = classId;
    }

    if (search) {
      where.OR = [
        { student: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { student: { admissionNo: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [enrollments, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        skip,
        take,
        include: {
          student: {
            include: { user: true },
          },
          class: {
            include: { academicYear: true },
          },
        },
        where,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return createPaginatedResponse(enrollments, total, page, limit);
  }

  async getEnrollmentById(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: { user: true },
        },
        class: {
          include: { academicYear: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  async getStudentEnrollments(studentId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [enrollments, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        skip,
        take,
        where: { studentId },
        include: {
          class: {
            include: { academicYear: true },
          },
        },
      }),
      this.prisma.enrollment.count({ where: { studentId } }),
    ]);

    return createPaginatedResponse(enrollments, total, page, limit);
  }

  async updateEnrollment(id: string, dto: UpdateEnrollmentDto) {
    const { startDate, endDate } = dto;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        student: {
          include: { user: true },
        },
        class: {
          include: { academicYear: true },
        },
      },
    });
  }

  async unenrollStudent(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.delete({
      where: { id },
    });
  }
}
