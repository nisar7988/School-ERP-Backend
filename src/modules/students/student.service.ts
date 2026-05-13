import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as bcrypt from 'bcrypt';
@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async addStudent(dto: CreateStudentDto) {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      password,
      classId, // ✅ important
      ...rest
    } = dto;

    const rawPassword = password;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const student = await this.prisma.student.create({
        data: {
          admissionNo: rest.admissionNo,
          rollNo: rest.rollNo,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          address: rest.address,
          fatherName: rest.fatherName,
          motherName: rest.motherName,
          emergencyContact: rest.emergencyContact,

          user: {
            create: {
              firstName,
              lastName,
              email,
              phone,
              password: hashedPassword,
              role: 'STUDENT',
            },
          },

          // 🔥 AUTO ENROLLMENT
          enrollments: {
            create: {
              classId,
              startDate: new Date(),
            },
          },
        },

        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
            },
          },
        },
      });

      return {
        student,
        credentials: {
          email,
          password: rawPassword, // ⚠️ only for initial share
        },
      };
    } catch (error: any) {
      console.error('Error creating student:', error); // Debugging line

      throw error;
    }
  }

  // 🔑 Secure password generator
  private generatePassword(): string {
    return Math.random().toString(36).slice(-8); // improve if needed
  }

  async getAllStudents(query: BaseQueryDto) {
    const { classId, page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(query.page, query.limit);

    const where = classId
      ? {
          enrollments: {
            some: {
              classId: classId,
            },
          },
        }
      : {};

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        skip,
        take,
        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
            },
          },
        },
        where,
      }),
      this.prisma.student.count({
        where,
      }),
    ]);
    return createPaginatedResponse(students, total, page, limit);
  }

  async getStudentById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        enrollments: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async updateStudent(id: string, updateData: Partial<UpdateStudentDto>) {
    const {
      admissionNo,
      rollNo,
      dateOfBirth,
      address,
      gender,
      fatherName,
      motherName,
      emergencyContact,
    } = updateData;

    return this.prisma.student.update({
      where: { id },
      data: {
        ...(admissionNo && { admissionNo }),
        ...(rollNo && { rollNo }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(address && { address }),
        ...(gender && { gender }),
        ...(fatherName && { fatherName }),
        ...(motherName && { motherName }),
        ...(emergencyContact && { emergencyContact }),
      },
      include: {
        user: true,
        enrollments: {
          include: {
            class: true,
          },
        },
      },
    });
  }

  async deleteStudent(id: string) {
    return this.prisma.student.delete({
      where: { id },
    });
  }
}
