import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicYearDto) {
    try {
      const academicYear = await this.prisma.academicYear.create({
        data: {
          year: dto.year,
        },
      });

      return academicYear;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Academic year ${dto.year} already exists`);
      }
      throw error;
    }
  }

  async findAll(query: BaseQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = buildPagination(page, limit);

    const [academicYears, total] = await this.prisma.$transaction([
      this.prisma.academicYear.findMany({
        skip,
        take,
        include: {
          classes: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
        },
        orderBy: {
          year: 'desc',
        },
      }),
      this.prisma.academicYear.count(),
    ]);

    return createPaginatedResponse(academicYears, total, page, limit);
  }

  async findById(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            students: true,
            subjects: true,
            staff: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    return academicYear;
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    try {
      const updated = await this.prisma.academicYear.update({
        where: { id },
        data: {
          ...(dto.year && { year: dto.year }),
        },
      });

      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Academic year ${dto.year} already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        classes: {
          select: { id: true },
        },
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    if (academicYear.classes.length > 0) {
      throw new ConflictException(
        'Cannot delete academic year with associated classes. Delete classes first.',
      );
    }

    return this.prisma.academicYear.delete({
      where: { id },
    });
  }

  async getCurrentYear(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear.toString().slice(-2)}`;
  }

  async getOrCreateCurrentYear() {
    const yearString = await this.getCurrentYear();

    const existing = await this.prisma.academicYear.findUnique({
      where: { year: yearString },
    });

    if (existing) {
      return existing;
    }
    return this.prisma.academicYear.create({
      data: {
        year: yearString,
      },
    });
  }
}
