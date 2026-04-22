import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import { buildPagination } from '../../common/utils/pagination.util';
@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

 async findAll(query: AttendanceQueryDto) {
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  const pagination = buildPagination(page, limit);

  const where: any = {};

  if (status) {
    where.status = status;
  }

  const allowedSortFields = ['date', 'status', 'studentId', 'createdAt'];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : 'createdAt';

  const data = await this.prisma.attendance.findMany({
    where,
    ...pagination,
  include: { student: true },
    orderBy: {
      [safeSortBy]: order,
    },
  });

  const total = await this.prisma.attendance.count({ where });

  return createPaginatedResponse(data, total, page, limit);
}

  async create(createAttendanceDto: CreateAttendanceDto) {
    const { studentId, classId, date, status } = createAttendanceDto;

    return this.prisma.attendance.upsert({
      where: { studentId_date: { studentId, date: new Date(date) } },
      create: {
        studentId,
        classId,
        date: new Date(date),
        status,
      },
      update: {
        status,
      },
    });
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    return this.prisma.attendance.update({
      where: { id },
      data: updateAttendanceDto,
    });
  }

  async getAttendanceById(id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
    });
  }
}
