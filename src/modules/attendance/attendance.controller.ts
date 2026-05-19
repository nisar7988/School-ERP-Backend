import { Controller, Patch, Post, Body, Param, Get, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CreateBulkAttendanceDto } from './dto/create-bulk-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}
  @Get()
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('student/:userId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getAttendanceByStudentId(
    @Param('userId') userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.getAttendanceByStudentId(userId, query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.TEACHER)
  async createBulk(@Body() createBulkAttendanceDto: CreateBulkAttendanceDto) {
    return this.attendanceService.createBulk(createBulkAttendanceDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, updateAttendanceDto);
  }
}
