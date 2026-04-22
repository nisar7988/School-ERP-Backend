import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClassStaffService } from './class-staff.service';
import { CreateClassStaffDto } from './dto/create-class-staff.dto';
import { UpdateClassStaffDto } from './dto/update-class-staff.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';

@ApiTags('Class Staff')
@ApiBearerAuth('access-token')
@Controller('class-staff')
export class ClassStaffController {
  constructor(private readonly classStaffService: ClassStaffService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async assignTeacher(@Body() dto: CreateClassStaffDto) {
    return this.classStaffService.assignTeacher(dto);
  }

  @Get('class/:classId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getClassStaff(
    @Param('classId') classId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.classStaffService.getClassStaff(classId, query);
  }

  @Get('class/:classId/incharge')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getClassIncharge(@Param('classId') classId: string) {
    return this.classStaffService.getClassIncharge(classId);
  }

  @Get('class/:classId/subject-teachers')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getClassSubjectTeachers(
    @Param('classId') classId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.classStaffService.getClassSubjectTeachers(classId, query);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getTeacherClasses(
    @Param('teacherId') teacherId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.classStaffService.getTeacherClasses(teacherId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getClassStaffById(@Param('id') id: string) {
    return this.classStaffService.getClassStaffById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async updateClassStaff(
    @Param('id') id: string,
    @Body() dto: UpdateClassStaffDto,
  ) {
    return this.classStaffService.updateClassStaff(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async removeTeacherFromClass(@Param('id') id: string) {
    return this.classStaffService.removeTeacherFromClass(id);
  }
}
