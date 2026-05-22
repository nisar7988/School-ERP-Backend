import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { BaseQueryDto } from '../../common/dto/query.dto';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ClassService } from '../class/class.service';
import { Role } from '../../common/enums/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../claudinary/claudinary.service';
import { imageUploadConfig } from '../../common/config/multer-image.config';
@ApiBearerAuth('access-token')
@Controller('teachers')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly classService: ClassService,
    private readonly cloudinaryService: CloudinaryService,
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage', imageUploadConfig))
  async addTeacher(
    @Body() teacherData: CreateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      teacherData.profileImage = upload.secure_url;
    }
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
