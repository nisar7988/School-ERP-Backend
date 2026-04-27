import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(userData: any): Promise<any> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const encryptedPassword = await bcrypt.hash(userData.password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        password: encryptedPassword,
      },
    });
  }

  async findById(id: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async deleteUser(id: string): Promise<any> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async activeUser(id: string): Promise<any> {
    return await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
  async deactiveUser(id: string): Promise<any> {
    return await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateUser(id: string, updateData: any): Promise<any> {
    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async getAllUsers(): Promise<any[]> {
    return await this.prisma.user.findMany();
  }

  async getUserDetails(id: string): Promise<any> {
    console.log('Fetching user details for ID:', id); // Debugging line
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
