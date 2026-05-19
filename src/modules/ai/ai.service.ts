import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';

@Injectable()
export class AiService {
  private readonly openrouter: OpenRouter;
  private readonly logger = new Logger(AiService.name);

  // Reliable free models as fallbacks
  private readonly models = ['openrouter/owl-alpha', 'openrouter/auto'];

  constructor() {
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async askAI(prompt: string): Promise<string> {
    for (const model of this.models) {
      let retries = 2;

      while (retries > 0) {
        try {
          const response = await this.openrouter.chat.send({
            chatRequest: {
              model,
              messages: [
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              stream: false,
            },
          });

          const content = response.choices?.[0]?.message?.content;

          if (content?.trim()) {
            console.log('content', content);
            return content.trim();
          }

          throw new Error('Empty response');
        } catch (err: any) {
          const statusCode = err?.status || err?.statusCode || err?.error?.code || err?.code;
          this.logger.warn(`Model ${model} failed with status code: ${statusCode}`);

          // Retry same model if 429 (Rate Limited)
          if (statusCode === 429 && retries > 1) {
            await this.delay(1000 * Math.pow(2, 3 - retries));
            retries--;
            continue;
          }

          break; // move to next fallback model
        }
      }
    }

    this.logger.error('All AI fallback models failed');
    throw new InternalServerErrorException(
      'I am currently experiencing high load. Please try again later.',
    );
  }
}
