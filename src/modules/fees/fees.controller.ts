import { Controller } from '@nestjs/common';
import { FeesService } from './fees.service';
import { Get, Post, Body, Patch, Param } from '@nestjs/common';
import { CreateFeeRecordDto } from './dto/create-fee-record.dto';
import { UpdateFeeRecordDto } from './dto/update-fee-record.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('fees')
export class FeesController {
    constructor(private readonly feesService: FeesService) {}

    @Get()
    @Roles(Role.ADMIN, Role.STUDENT)
    async getAllFees() {
        return this.feesService.getAllFees();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.STUDENT)
    async getFeeById(@Param('id') id: string) {
        return this.feesService.getFeeById(id);
    }

    @Post()
    @Roles(Role.ADMIN)
    async create(@Body() createFeeDto: CreateFeeRecordDto) {
        return this.feesService.create(createFeeDto);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateFeeDto: UpdateFeeRecordDto
        
    ) {
        return this.feesService.update(id, updateFeeDto);
    }
}
