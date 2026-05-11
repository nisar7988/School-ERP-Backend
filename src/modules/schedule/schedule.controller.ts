import { Controller } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    return this.scheduleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateScheduleDto: Partial<CreateScheduleDto>) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.scheduleService.delete(id);
  }

  @Get('class/:classId')
  async getScheduleForClass(@Param('classId') classId: string) {
    return this.scheduleService.getScheduleForClass(classId);
  }
  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('teacher/:teacherId')
  async getScheduleForTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.getScheduleForTeacher(teacherId);
  }
}
