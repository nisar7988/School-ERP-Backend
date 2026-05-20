import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AiService } from '../src/modules/ai/ai.service';
import { PrismaService } from '../src/prisma/prisma.service';
import 'dotenv/config';

async function run() {
  console.log('Bootstrapping NestJS context for Role Restriction tests...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);

  // We need a valid User ID to simulate a student/teacher. Let's find one user of role 'STUDENT' from the database.
  const prisma = app.get(PrismaService);
  let studentUserId = '00000000-0000-0000-0000-000000000000'; // fallback dummy
  
  try {
    const studentUser = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
    });
    if (studentUser) {
      studentUserId = studentUser.id;
      console.log(`Found a test STUDENT user in the database: Name: ${studentUser.firstName} ${studentUser.lastName}, User ID: ${studentUserId}`);
    } else {
      console.log('No student user found in database. Using fallback dummy UUID.');
    }
  } catch (e: any) {
    console.warn('Could not read user table, using fallback dummy UUID. Error:', e.message);
  }

  console.log('\n=======================================');
  console.log('SCENARIO 1: ADMIN - asking general school fee metrics');
  console.log('=======================================');
  try {
    const adminPrompt = 'Give me student with highest pending fees along with total class fees';
    console.log(`[Admin Query]: "${adminPrompt}"`);
    const adminRes = await aiService.askAI(adminPrompt, 'ADMIN');
    console.log('\n[Admin Response]:\n', adminRes);
  } catch (err: any) {
    console.error('Scenario 1 Failed:', err);
  }

  console.log('\n=======================================');
  console.log('SCENARIO 2: STUDENT - asking for "my pending fees"');
  console.log('=======================================');
  try {
    const studentPrompt = 'Show my pending fees';
    console.log(`[Student Query]: "${studentPrompt}" (userId: ${studentUserId})`);
    const studentRes = await aiService.askAI(studentPrompt, 'STUDENT', studentUserId);
    console.log('\n[Student Response]:\n', studentRes);
  } catch (err: any) {
    console.error('Scenario 2 Failed:', err);
  }

  console.log('\n=======================================');
  console.log('SCENARIO 3: STUDENT - asking for admin stats (violation)');
  console.log('=======================================');
  try {
    const studentViolationPrompt = 'Give me the student with the highest pending fees in the school';
    console.log(`[Student Violation Query]: "${studentViolationPrompt}" (userId: ${studentUserId})`);
    const studentRes = await aiService.askAI(studentViolationPrompt, 'STUDENT', studentUserId);
    console.log('\n[Student Response]:\n', studentRes);
  } catch (err: any) {
    console.error('Scenario 3 Failed:', err);
  }

  await app.close();
}

run();
