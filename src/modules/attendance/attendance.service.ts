import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CreateBulkAttendanceDto } from './dto/create-bulk-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import { buildPagination } from '../../common/utils/pagination.util';
@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AttendanceQueryDto) {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search, classId, date } = query;

    const pagination = buildPagination(page, limit);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (classId) {
      where.classId = classId;
    }

    if (date) {
      where.date = new Date(date);
    }

    if (search) {
      where.OR = [
        { student: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { student: { admissionNo: { contains: search, mode: 'insensitive' } } },
      ];
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

  async createBulk(createBulkAttendanceDto: CreateBulkAttendanceDto) {
    const { classId, date, records } = createBulkAttendanceDto;
    const parsedDate = new Date(date);

    return this.prisma.$transaction(
      records.map((record) =>
        this.prisma.attendance.upsert({
          where: { studentId_date: { studentId: record.studentId, date: parsedDate } },
          create: {
            studentId: record.studentId,
            classId,
            date: parsedDate,
            status: record.status,
          },
          update: {
            status: record.status,
          },
        })
      )
    );
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    return this.prisma.attendance.update({
      where: { id },
      data: updateAttendanceDto,
    });
  }


  async getAttendanceByStudentId(userId: string, query: AttendanceQueryDto) {
    const { month, status } = query;

    const student = await this.prisma.student.findUnique({
      where: { userId },
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
