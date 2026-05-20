import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AiService } from '../src/modules/ai/ai.service';
import 'dotenv/config';

async function run() {
  console.log('Bootstrapping NestJS context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);

  const prompt = 'Give me student with highest pending fees along with total class fees';
  console.log(`Sending prompt: "${prompt}"`);

  try {
    const response = await aiService.askAI(prompt);
    console.log('\n--- AI RESPONSE ---');
    console.log(response);
    console.log('-------------------\n');
  } catch (error) {
    console.error('Error during test-ask run:', error);
  } finally {
    await app.close();
  }
}

run();
