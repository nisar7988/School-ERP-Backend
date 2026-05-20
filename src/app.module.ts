import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentModule } from './modules/students/student.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AcademicYearModule } from './modules/academic-year/academic-year.module';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClassModule } from './modules/class/class.module';
import { TeacherModule } from './modules/teachers/teacher.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeesModule } from './modules/fees/fees.module';
import { SubjectModule } from './modules/subjects/subject.module';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ClaudinaryModule } from './modules/claudinary/claudinary.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AiModule } from './modules/ai/ai.module';

import { PdfModule } from './modules/pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AcademicYearModule,
    StudentModule,
    PaymentModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassModule,
    TeacherModule,
    AttendanceModule,
    FeesModule,
    SubjectModule,
    ClaudinaryModule,
    ScheduleModule,
    AiModule,
    PdfModule,
  ],
  controllers: [AppController],
 providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, 
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, 
    },
    AppService,
  ],

})
export class AppModule {}
