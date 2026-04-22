import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassStaffDto } from './dto/create-class-staff.dto';
import { UpdateClassStaffDto } from './dto/update-class-staff.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class ClassStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async assignTeacher(dto: CreateClassStaffDto) {
    const { classId, teacherId, role } = dto;

    // Verify class and teacher exist
    const [schoolClass, teacher] = await Promise.all([
      this.prisma.schoolClass.findUnique({ where: { id: classId } }),
      this.prisma.teacher.findUnique({ where: { id: teacherId } }),
    ]);

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check for duplicate assignment with same role
    const existingAssignment = await this.prisma.classStaff.findUnique({
      where: {
        classId_teacherId_role: {
          classId,
          teacherId,
          role,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Teacher already assigned to this class with role ${role}`,
      );
    }

    try {
      const classStaff = await this.prisma.classStaff.create({
        data: {
          classId,
          teacherId,
          role,
        },
        include: {
          class: {
            include: { academicYear: true },
          },
          teacher: {
            include: { user: true },
          },
        },
      });

      return classStaff;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Teacher already assigned to this class with this role',
        );
      }
      throw error;
    }
  }

  async getClassStaff(classId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify class exists
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    const [staff, total] = await this.prisma.$transaction([
      this.prisma.classStaff.findMany({
        skip,
        take,
        where: { classId },
        include: {
          teacher: {
            include: { user: true },
          },
        },
      }),
      this.prisma.classStaff.count({ where: { classId } }),
    ]);

    return createPaginatedResponse(staff, total, page, limit);
  }

  async getTeacherClasses(teacherId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const [assignments, total] = await this.prisma.$transaction([
      this.prisma.classStaff.findMany({
        skip,
        take,
        where: { teacherId },
        include: {
          class: {
            include: { academicYear: true },
          },
        },
      }),
      this.prisma.classStaff.count({ where: { teacherId } }),
    ]);

    return createPaginatedResponse(assignments, total, page, limit);
  }

  async getClassIncharge(classId: string) {
    const incharge = await this.prisma.classStaff.findFirst({
      where: {
        classId,
        role: 'INCHARGE',
      },
      include: {
        teacher: {
          include: { user: true },
        },
      },
    });

    if (!incharge) {
      throw new NotFoundException('Class incharge not found');
    }

    return incharge;
  }

  async getClassSubjectTeachers(classId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify class exists
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    const [teachers, total] = await this.prisma.$transaction([
      this.prisma.classStaff.findMany({
        skip,
        take,
        where: {
          classId,
          role: 'SUBJECT_TEACHER',
        },
        include: {
          teacher: {
            include: { user: true },
          },
        },
      }),
      this.prisma.classStaff.count({
        where: {
          classId,
          role: 'SUBJECT_TEACHER',
        },
      }),
    ]);

    return createPaginatedResponse(teachers, total, page, limit);
  }

  async updateClassStaff(id: string, dto: UpdateClassStaffDto) {
    const classStaff = await this.prisma.classStaff.findUnique({
      where: { id },
    });

    if (!classStaff) {
      throw new NotFoundException('Class staff assignment not found');
    }

    // Check if new role already exists for this teacher-class combo
    if (dto.role) {
      const existingWithRole = await this.prisma.classStaff.findUnique({
        where: {
          classId_teacherId_role: {
            classId: classStaff.classId,
            teacherId: classStaff.teacherId,
            role: dto.role,
          },
        },
      });

      if (existingWithRole && existingWithRole.id !== id) {
        throw new ConflictException(
          `Teacher already has this role in the class`,
        );
      }
    }

    return this.prisma.classStaff.update({
      where: { id },
      data: dto,
      include: {
        class: {
          include: { academicYear: true },
        },
        teacher: {
          include: { user: true },
        },
      },
    });
  }

  async removeTeacherFromClass(id: string) {
    const classStaff = await this.prisma.classStaff.findUnique({
      where: { id },
    });

    if (!classStaff) {
      throw new NotFoundException('Class staff assignment not found');
    }

    return this.prisma.classStaff.delete({
      where: { id },
    });
  }

  async getClassStaffById(id: string) {
    const classStaff = await this.prisma.classStaff.findUnique({
      where: { id },
      include: {
        class: {
          include: { academicYear: true },
        },
        teacher: {
          include: { user: true },
        },
      },
    });

    if (!classStaff) {
      throw new NotFoundException('Class staff assignment not found');
    }

    return classStaff;
  }
}
