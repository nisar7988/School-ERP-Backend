import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(userData: CreateUserDto): Promise<any> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const encryptedPassword = await bcrypt.hash(userData.password, 10);
    const profileImage = typeof userData.profileImage === 'string' ? userData.profileImage : undefined;

    return this.prisma.user.create({
      data: {
        ...userData,
        password: encryptedPassword,
        profileImage,
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: { include: { enrollments: { include: { class: true } } } },
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfileImage(userId: string, imagePath: string): Promise<any> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: imagePath },
    });
  }
}
