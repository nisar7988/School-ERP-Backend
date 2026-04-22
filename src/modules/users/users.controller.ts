import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService
    ) {}
    
    @Post()
    @Roles(Role.ADMIN)
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto);
    }
    @Get()
    @Roles(Role.ADMIN)
    async findAll() {
        return this.usersService.getAllUsers();
    }
}
