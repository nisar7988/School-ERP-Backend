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
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';

@ApiTags('Enrollments')
@ApiBearerAuth('access-token')
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async enrollStudent(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.enrollStudent(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  async getEnrollments(@Query() query: BaseQueryDto) {
    return this.enrollmentService.getEnrollments(query);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getStudentEnrollments(
    @Param('studentId') studentId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.enrollmentService.getStudentEnrollments(studentId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getEnrollmentById(@Param('id') id: string) {
    return this.enrollmentService.getEnrollmentById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async updateEnrollment(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.updateEnrollment(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async unenrollStudent(@Param('id') id: string) {
    return this.enrollmentService.unenrollStudent(id);
  }
}
