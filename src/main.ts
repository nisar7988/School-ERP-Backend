import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './common/filters/prisma-exception/prisma-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
async function bootstrap() {
  
  // ✅ Create NestJS application --- IGNORE ---
  const app = await NestFactory.create(AppModule);

  //enable cors 
app.enableCors({
  origin: true,
  credentials: true,
});
  // ✅ Global Validation Pipe --- IGNORE ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✅ Swagger setup --- IGNORE ---
const config = new DocumentBuilder()
  .setTitle('ERP API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header',
    },
    'access-token', // 👈 name (important)
  )
  .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);
app.setGlobalPrefix('api');

  
  // ✅ Global Interceptors, Guards, and Filters --- IGNORE ---
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new PrismaExceptionFilter());

  // ✅ Start the server --- IGNORE ---
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
