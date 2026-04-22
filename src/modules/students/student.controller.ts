import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Query } from '@nestjs/common/decorators'
import { BaseQueryDto } from '../../common/dto/query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  async getAllStudents(@Query() query: BaseQueryDto) {
    return this.studentService.getAllStudents(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getStudentById(@Param('id') id: string) {
    return this.studentService.getStudentById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async addStudent(@Body() studentData: CreateStudentDto) {
    console.log(studentData);
    return this.studentService.addStudent(studentData);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async updateStudent(
    @Param('id') id: string,
    @Body() updateData: UpdateStudentDto,
  ) {
    return this.studentService.updateStudent(id, updateData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteStudent(@Param('id') id: string) {
    return this.studentService.deleteStudent(id);
  }
}
