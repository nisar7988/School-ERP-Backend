import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as bcrypt from 'bcrypt';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async addTeacher(data: CreateTeacherDto) {
    const profileImage = typeof data.profileImage === 'string' ? data.profileImage : undefined;
    return this.prisma.$transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: 'TEACHER',
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          profileImage,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          employeeId: data.employeeId,
          qualification: data.qualification,
          userId: user.id,
        },
      });

      return { user, teacher };
    });
  }

  removeTeacher(id: string) {
    return this.prisma.teacher.delete({ where: { id } });
  }

  async getAllTeachers(query: BaseQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const { skip, take } = buildPagination(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        skip,
        take,
        where,
        include: { user: true },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return createPaginatedResponse(teachers, total, page, limit);
  }

  getTeacherById(id: string) {
    return this.prisma.teacher.findUnique({ where: { id }, include: { user: true } });
  }

updateTeacher(id: string, updateData: Partial<CreateTeacherDto>) {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    gender,
    employeeId,
    qualification,
  } = updateData;

  const hashedPassword = password
    ? bcrypt.hashSync(password, 10)
    : undefined;

  return this.prisma.teacher.update({
    where: { id },
    data: {
      ...(employeeId && { employeeId }),
      ...(qualification && { qualification }),
      ...(gender && { gender }), 

      user: {
        update: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(hashedPassword && { password: hashedPassword }),
        },
      },
    },
  });
}
}
