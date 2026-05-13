import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';
import { AcademicYearService } from '../academic-year/academic-year.service';
import { CreateAcademicYearDto } from '../academic-year/dto/create-academic-year.dto';
@Injectable()
export class ClassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicYearService: AcademicYearService,
  ) {}
  async findAll(query: BaseQueryDto) {
    const { classId, page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(query.page, query.limit);
    const [classes, total] = await this.prisma.$transaction([
      this.prisma.schoolClass.findMany({
        skip,
        take,
        include: {
          academicYear: true,
          students: true,
          subjects: true,
          staff: {
            include: { teacher: { include: { user: true } } },
          },
          ...(classId && { where: { id: classId } }),
        },
      }),
      this.prisma.schoolClass.count(),
    ]);

    return createPaginatedResponse(classes, total, page, limit);
  }

  async findOne(id: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      include: {
        academicYear: true,
        students: {
          include: { student: { include: { user: true } } },
        },
        subjects: true,
        staff: {
          include: { teacher: { include: { user: true } } },
        },
      },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    return schoolClass;
  }
  async create(data: CreateClassDto) {
    const { name, section, academicYearId } = data;
    let finalAcademicYearId = academicYearId;
    if (!finalAcademicYearId) {
      const currentYear = await this.academicYearService.getOrCreateCurrentYear();

      if (!currentYear) {
        throw new NotFoundException('No current academic year found');
      }

      finalAcademicYearId = currentYear.id;
    } else {
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id: finalAcademicYearId },
      });

      if (!academicYear) {
        throw new NotFoundException('Academic year not found');
      }
    }

    try {
      return await this.prisma.schoolClass.create({
        data: {
          name,
          section,
          academicYearId: finalAcademicYearId,
          ...(data.staff && {
            staff: {
              create: data.staff.map((s) => ({
                teacherId: s.teacherId,
                role: s.role,
              })),
            },
          }),
        },
        include: {
          academicYear: true,
          staff: {
            include: { teacher: { include: { user: true } } },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Class ${name} section ${section} already exists in this academic year`,
        );
      }
      throw error;
    }
  }
  async update(id: string, data: UpdateClassDto) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
    });

    const subjects = data.subjects;
    if (subjects && subjects.length > 0) {
      const existingSubjects = await this.prisma.subject.findMany({
        where: { id: { in: subjects } },
      });
      const existingSubjectIds = existingSubjects.map((s) => s.id);
      const invalidSubjectIds = subjects.filter((s) => !existingSubjectIds.includes(s));
      if (invalidSubjectIds.length > 0) {
        throw new NotFoundException(`Subjects not found: ${invalidSubjectIds.join(', ')}`);
      }
    }
    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    return await this.prisma.schoolClass.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.section && { section: data.section }),

        ...(data.subjects &&
          data.subjects.length > 0 && {
            subjects: {
              connect: data.subjects.map((subjectId) => ({ id: subjectId })),
            },
          }),

        ...(data.staff && {
          staff: {
            deleteMany: {}, // remove old staff
            create: data.staff.map((s) => ({
              teacherId: s.teacherId,
              role: s.role,
            })),
          },
        }),
      },
      include: {
        academicYear: true,
        subjects: true,
        staff: {
          include: { teacher: { include: { user: true } } },
        },
      },
    });
  }
  async delete(id: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.schoolClass.delete({
      where: { id },
    });
  }

  async getClassesForTeacher(userId: string) {
    const data = await this.prisma.schoolClass.findMany({
      where: {
        staff: {
          some: {
            teacher: {
              userId: userId,
            },
          },
        },
      },
      include: {
        academicYear: true,
      },
    });
    return createPaginatedResponse(data, data.length, 1, data.length);
  }
}
