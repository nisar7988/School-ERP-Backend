import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../claudinary/claudinary.service';

@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only image files allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async create(@Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      createUserDto.profileImage = upload.secure_url;
    }
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.usersService.getAllUsers();
  }

  @Get('/me')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async getMyProfile(@Req() req) {
    const user = req.user;
    return this.usersService.getUserDetails(user.userId);
  }

  @Patch('me/profile-image')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only image files allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async updateProfileImage(@Req() req, @UploadedFile() file?: Express.Multer.File) {
    const user = req.user;
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const upload = await this.cloudinaryService.uploadFile(file);
    return this.usersService.updateProfileImage(user.userId, upload.secure_url);
  }
}
