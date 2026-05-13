import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: BaseQueryDto) {
    const { page = 1, limit = 10, classId, search, sortBy = 'createdAt', order = 'desc' } = query;
    const { skip, take } = buildPagination(page, limit);

    const where: any = {};
    const allowedSortFields = ['name', 'code', 'createdAt', 'updatedAt'];
    const orderBy = allowedSortFields.includes(sortBy) ? { [sortBy]: order } : { createdAt: order };

    if (classId) {
      where.classId = classId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await this.prisma.$transaction([
      this.prisma.subject.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          class: { include: { academicYear: true } },
          teachers: {
            include: { teacher: { include: { user: true } } },
          },
        },
      }),
      this.prisma.subject.count({ where }),
    ]);

    return createPaginatedResponse(subjects, total, page, limit);
  }


  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        class: { include: { academicYear: true } },
        teachers: {
          include: { teacher: { include: { user: true } } },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async create(dto: CreateSubjectDto) {
    const classExists = await this.prisma.schoolClass.findUnique({
      where: { id: dto.classId },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    try {
      return this.prisma.subject.create({
        data: {
          name: dto.name,
          code: dto.code,
          classId: dto.classId,
        },
        include: {
          class: { include: { academicYear: true } },
          teachers: {
            include: { teacher: { include: { user: true } } },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Subject code already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (dto.classId) {
      const classExists = await this.prisma.schoolClass.findUnique({
        where: { id: dto.classId },
      });
      if (!classExists) {
        throw new NotFoundException('Class not found');
      }
    }

    try {
      return this.prisma.subject.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.code !== undefined && { code: dto.code }),
          ...(dto.classId !== undefined && { classId: dto.classId }),
        },
        include: {
          class: { include: { academicYear: true } },
          teachers: {
            include: { teacher: { include: { user: true } } },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Subject code already exists');
      }
      throw error;
    }
  }

  async delete(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
