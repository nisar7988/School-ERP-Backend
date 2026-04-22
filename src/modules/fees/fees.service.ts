import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateFeeRecordDto } from './dto/update-fee-record.dto';
import { CreateFeeRecordDto } from './dto/create-fee-record.dto';
@Injectable()
export class FeesService {

    constructor(private readonly prisma: PrismaService) {}

    async getAllFees() {
        return this.prisma.feeRecord.findMany();
    }

    async getFeeById(id: string) {
        return this.prisma.feeRecord.findUnique({
            where: { id },
        });
    }

    async create(createFeeDto: CreateFeeRecordDto) {
        const { studentId, amount, dueDate } = createFeeDto;

        return this.prisma.feeRecord.create({
            data: createFeeDto
        });
    }

    async update(id: string, updateFeeDto: UpdateFeeRecordDto) {
        return this.prisma.feeRecord.update({
            where: { id },
            data: updateFeeDto,
        });
    }
}
