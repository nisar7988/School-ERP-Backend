import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as bcrypt from 'bcrypt';
import { FeesService } from '../fees/fees.service';
import { async } from 'rxjs';
@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feeService: FeesService,
  ) {}

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
      profileImage,
      ...rest
    } = dto;

    const sanitizedProfileImage = typeof profileImage === 'string' ? profileImage : undefined;
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
              profileImage: sanitizedProfileImage,
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

      //link studetn to class fees
      await this.feeService.autoGenerateFeesForStudent(student.id);
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

  async getAllStudents(query: BaseQueryDto) {
    const { classId, page = 1, limit = 10, search } = query;
    const { skip, take } = buildPagination(page, limit);

    const where: any = {};

    if (classId) {
      where.enrollments = {
        some: {
          classId: classId,
        },
      };
    }

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
      ];
    }

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
      profileImage,
    } = updateData;
    return await this.prisma.student.update({
      where: { id },
      data: {
        ...(admissionNo !== undefined && { admissionNo }),
        ...(rollNo !== undefined && { rollNo }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(address !== undefined && { address }),
        ...(gender !== undefined && { gender }),
        ...(fatherName !== undefined && { fatherName }),
        ...(motherName !== undefined && { motherName }),
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(profileImage && {
          user: {
            update: {
              profileImage,
            },
          },
        }),
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
