import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateScheduleDto) {
    await this.prisma.schedule.create({ data });
  }

  async findAll() {
    return await this.prisma.schedule.findMany({
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }

  async findOne(id: string) {
    return await this.prisma.schedule.findUnique({
      where: { id },
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }

  async update(id: string, data: Partial<CreateScheduleDto>) {
    return await this.prisma.schedule.update({
      where: { id },
      data,
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }

  async delete(id: string) {
    return await this.prisma.schedule.delete({
      where: { id },
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }

  async getScheduleForClass(classId: string) {
    return await this.prisma.schedule.findMany({
      where: { classId },
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }

  async getScheduleForTeacher(teacherId: string) {
    return await this.prisma.schedule.findMany({
      where: { teacherId },
      include: { subject: true, teacher: { include: { user: true } } },
    });
  }
}
