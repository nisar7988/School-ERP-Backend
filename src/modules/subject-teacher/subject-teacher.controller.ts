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
import { SubjectTeacherService } from './subject-teacher.service';
import { CreateSubjectTeacherDto } from './dto/create-subject-teacher.dto';
import { UpdateSubjectTeacherDto } from './dto/update-subject-teacher.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';

@ApiTags('Subject Teachers')
@ApiBearerAuth('access-token')
@Controller('subject-teachers')
export class SubjectTeacherController {
  constructor(private readonly subjectTeacherService: SubjectTeacherService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async assignTeacherToSubject(@Body() dto: CreateSubjectTeacherDto) {
    return this.subjectTeacherService.assignTeacherToSubject(dto);
  }

  @Get('subject/:subjectId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getSubjectTeachers(
    @Param('subjectId') subjectId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.subjectTeacherService.getSubjectTeachers(subjectId, query);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getTeacherSubjects(
    @Param('teacherId') teacherId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.subjectTeacherService.getTeacherSubjects(teacherId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getSubjectTeacherById(@Param('id') id: string) {
    return this.subjectTeacherService.getSubjectTeacherById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async updateSubjectTeacher(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectTeacherDto,
  ) {
    return this.subjectTeacherService.updateSubjectTeacher(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async removeTeacherFromSubject(@Param('id') id: string) {
    return this.subjectTeacherService.removeTeacherFromSubject(id);
  }
}
