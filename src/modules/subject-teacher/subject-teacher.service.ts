import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';
import { UpdateSubjectTeacherDto } from './dto/update-subject-teacher.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class SubjectTeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async assignTeacherToSubject(dto: CreateSubjectTeacherDto) {
    const { subjectId, teacherId } = dto;

    // Verify subject and teacher exist
    const [subject, teacher] = await Promise.all([
      this.prisma.subject.findUnique({ where: { id: subjectId } }),
      this.prisma.teacher.findUnique({ where: { id: teacherId } }),
    ]);

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    try {
      const subjectTeacher = await this.prisma.subjectTeacher.create({
        data: {
          subjectId,
          teacherId,
        },
        include: {
          subject: {
            include: { class: { include: { academicYear: true } } },
          },
          teacher: {
            include: { user: true },
          },
        },
      });

      return subjectTeacher;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Teacher is already assigned to this subject',
        );
      }
      throw error;
    }
  }

  async getSubjectTeachers(subjectId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const [teachers, total] = await this.prisma.$transaction([
      this.prisma.subjectTeacher.findMany({
        skip,
        take,
        where: { subjectId },
        include: {
          teacher: {
            include: { user: true },
          },
        },
      }),
      this.prisma.subjectTeacher.count({ where: { subjectId } }),
    ]);

    return createPaginatedResponse(teachers, total, page, limit);
  }

  async getTeacherSubjects(teacherId: string, query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const [subjects, total] = await this.prisma.$transaction([
      this.prisma.subjectTeacher.findMany({
        skip,
        take,
        where: { teacherId },
        include: {
          subject: {
            include: { class: { include: { academicYear: true } } },
          },
        },
      }),
      this.prisma.subjectTeacher.count({ where: { teacherId } }),
    ]);

    return createPaginatedResponse(subjects, total, page, limit);
  }

  async getSubjectTeacherById(id: string) {
    const subjectTeacher = await this.prisma.subjectTeacher.findUnique({
      where: { id },
      include: {
        subject: {
          include: { class: { include: { academicYear: true } } },
        },
        teacher: {
          include: { user: true },
        },
      },
    });

    if (!subjectTeacher) {
      throw new NotFoundException('Subject teacher assignment not found');
    }

    return subjectTeacher;
  }

  async updateSubjectTeacher(
    id: string,
    dto: UpdateSubjectTeacherDto,
  ) {
    const subjectTeacher = await this.prisma.subjectTeacher.findUnique({
      where: { id },
    });

    if (!subjectTeacher) {
      throw new NotFoundException('Subject teacher assignment not found');
    }

    // If updating teacher, check for duplicate
    if (dto.teacherId) {
      const duplicate = await this.prisma.subjectTeacher.findUnique({
        where: {
          subjectId_teacherId: {
            subjectId: subjectTeacher.subjectId,
            teacherId: dto.teacherId,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'Teacher is already assigned to this subject',
        );
      }
    }

    return this.prisma.subjectTeacher.update({
      where: { id },
      data: dto,
      include: {
        subject: {
          include: { class: { include: { academicYear: true } } },
        },
        teacher: {
          include: { user: true },
        },
      },
    });
  }

  async removeTeacherFromSubject(id: string) {
    const subjectTeacher = await this.prisma.subjectTeacher.findUnique({
      where: { id },
    });

    if (!subjectTeacher) {
      throw new NotFoundException('Subject teacher assignment not found');
    }

    return this.prisma.subjectTeacher.delete({
      where: { id },
    });
  }
}
