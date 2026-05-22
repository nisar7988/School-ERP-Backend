import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Query } from '@nestjs/common/decorators';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../claudinary/claudinary.service';
import { imageUploadConfig } from '../../common/config/multer-image.config';

@ApiBearerAuth('access-token')
@Controller('students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage', imageUploadConfig))
  async addStudent(
    @Body() studentData: CreateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      studentData.profileImage = upload.secure_url;
    }
    console.log('studentData', studentData);
    return this.studentService.addStudent(studentData);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage', imageUploadConfig))
  async updateStudent(
    @Param('id') id: string,
    @Body() updateData: UpdateStudentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      updateData.profileImage = upload.secure_url;
    }
    return this.studentService.updateStudent(id, updateData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteStudent(@Param('id') id: string) {
    return this.studentService.deleteStudent(id);
  }
}
