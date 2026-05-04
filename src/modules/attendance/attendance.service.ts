import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = query;

    const pagination = buildPagination(page, limit);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const allowedSortFields = ['date', 'status', 'studentId', 'createdAt'];

    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const data = await this.prisma.attendance.findMany({
      where,
      ...pagination,
      include: { student: { include: { user: true } }, class: true },
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

  async getAttendanceByStudentId(studentId: string, query: AttendanceQueryDto) {
    const { month, status } = query;

    const student = await this.prisma.student.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let dateFilter = {};
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1);

      dateFilter = {
        date: {
          gte: startDate,
          lt: endDate,
        },
      };
    }

    const data = await this.prisma.attendance.findMany({
      where: {
        studentId: student.id,
        ...dateFilter,
        ...(status && { status }),
      },
      include: { class: true },
    });

    let present = 0;
    let absent = 0;

    for (const a of data) {
      if (a.status === 'PRESENT') present++;
      if (a.status === 'ABSENT') absent++;
    }

    const total = data.length;
    const percentage = total ? (present / total) * 100 : 0;

    const stats = {
      percentage,
      total,
      present,
      absent,
    };

    return {
      data,
      stats,
      pagination: createPaginatedResponse(data, total, 1, total),
    };
  }
}
