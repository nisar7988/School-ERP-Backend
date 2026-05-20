import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { UpdateStudentFeeDto } from './dto/update-student-fee.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BaseQueryDto } from '../../common/dto/query.dto';
import express from 'express';
import { FeesPdfService } from '../pdf/pdf.service';

@ApiTags('fees')
@ApiBearerAuth('access-token')
@Controller('fees')
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
    private readonly feesPdfService: FeesPdfService,
  ) {}

  @Post('structures')
  @Roles(Role.ADMIN)
  async createFeeForClass(@Body() createFeeStructureDto: CreateFeeStructureDto) {
    return this.feesService.createFeeForClass(createFeeStructureDto);
  }

  @Patch('structures/:id')
  @Roles(Role.ADMIN)
  async updateFeeForClass(
    @Param('id') id: string,
    @Body() updateFeeStructureDto: UpdateFeeStructureDto,
  ) {
    return this.feesService.updateFeeForClass(id, updateFeeStructureDto);
  }

  @Delete('structures/:id')
  @Roles(Role.ADMIN)
  async deleteFeeStructureForClass(@Param('id') id: string) {
    return this.feesService.deleteFeeStructureForClass(id);
  }

  @Get('structures')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getAllFeeStructures(@Query() query: BaseQueryDto) {
    return this.feesService.getAllFeeStructures(query);
  }

  @Get('structures/class/:classId')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getFeeStructureForClass(@Param('classId') classId: string) {
    return this.feesService.getFeeStructureForClass(classId);
  }

  @Get('pending/class/:classId')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getPendingFeesForClass(@Param('classId') classId: string) {
    return this.feesService.getPendingFeesForClass(classId);
  }

  @Post('student-fees')
  @Roles(Role.ADMIN)
  async createStudentFee(@Body() createStudentFeeDto: CreateStudentFeeDto) {
    return this.feesService.createStudentFee(createStudentFeeDto);
  }

  @Patch('student-fees/:id')
  @Roles(Role.ADMIN)
  async updateStudentFee(
    @Param('id') id: string,
    @Body() updateStudentFeeDto: UpdateStudentFeeDto,
  ) {
    return this.feesService.updateStudentFee(id, updateStudentFeeDto);
  }

  @Delete('student-fees/:id')
  @Roles(Role.ADMIN)
  async deleteStudentFee(@Param('id') id: string) {
    return this.feesService.deleteStudentFee(id);
  }

  @Get('student-fees')
  @Roles(Role.ADMIN, Role.TEACHER)
  async getAllStudentFees(@Query() query: BaseQueryDto) {
    return this.feesService.getAllStudentFees(query);
  }

  @Get('student-fees/student/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getStudentFeesByStudent(@Param('studentId') studentId: string) {
    return this.feesService.getStudentFeesByStudent(studentId);
  }

  @Post('auto-generate/student/:studentId')
  @Roles(Role.ADMIN)
  async autoGenerateFeesForStudent(@Param('studentId') studentId: string) {
    return this.feesService.autoGenerateFeesForStudent(studentId);
  }

  @Get('status/student/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getStudentEnrollmentStatus(@Param('studentId') studentId: string) {
    return this.feesService.getStudentEnrollmentStatus(studentId);
  }

  @Post('bulk-create/class/:classId')
  @Roles(Role.ADMIN)
  async createStudentFeesForClass(
    @Param('classId') classId: string,
    @Body() body: { dueDate: string },
  ) {
    return this.feesService.createStudentFeesForClassStudents(classId, body.dueDate);
  }

  @Get('student/:studentId/report')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async generateFeeReport(@Param('studentId') studentId: string, @Res() res: express.Response) {
    // Fetch student fees with related data
    const fees = await this.feesService.getStudentFeesByStudent(studentId);

    // Fetch student info via the enrollment status helper (has student + class info)
    const enrollment = await this.feesService.getStudentEnrollmentStatus(studentId);

    // Build totals
    const totalFees = fees.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalPaid = fees.reduce((sum, f) => sum + Number(f.paidAmount), 0);
    const totalPending = fees.reduce((sum, f) => sum + Number(f.pendingAmount), 0);

    const pdfBuffer = await this.feesPdfService.generateFeePdf({
      studentName: enrollment.studentName || 'N/A',
      rollNo: enrollment.rollNo || 'N/A',
      className: enrollment.className || 'N/A',
      fees: fees.map((f) => ({
        title: f.feeStructure?.title || 'Fee',
        amount: Number(f.amount),
        paidAmount: Number(f.paidAmount),
        pendingAmount: Number(f.pendingAmount),
        status: f.status,
      })),
      totalFees,
      totalPaid,
      totalPending,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fee_report_${studentId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
