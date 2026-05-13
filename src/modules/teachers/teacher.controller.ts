import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { Controller, Post, Patch, Get, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClassService } from '../class/class.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/roles.enum';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';


@ApiBearerAuth('access-token')
@Controller('teachers')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly classService: ClassService,
  ) {}

  @Get()
  getAllTeachers(@Query() query: BaseQueryDto) {
    return this.teacherService.getAllTeachers(query);
  }
  @Get('classes')
  @Roles(Role.TEACHER)
  getClassesForTeacher(@Req() req, @Query() query: BaseQueryDto) {
    return this.classService.getClassesForTeacher(req.user.userId, query);
  }

  @Get(':id')
  getTeacherById(@Param('id') id: string) {
    return this.teacherService.getTeacherById(id);
  }

  @Post()
  addTeacher(@Body() teacherData: CreateTeacherDto) {
    return this.teacherService.addTeacher(teacherData);
  }

  @Patch(':id')
  updateTeacher(@Param('id') id: string, @Body() updateData: Partial<CreateTeacherDto>) {
    return this.teacherService.updateTeacher(id, updateData);
  }

  @Delete(':id')
  removeTeacher(@Param('id') id: string) {
    return this.teacherService.removeTeacher(id);
  }


}
