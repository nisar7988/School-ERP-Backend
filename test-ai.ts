import { OpenRouter } from '@openrouter/sdk';
import 'dotenv/config';

async function test() {
  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const response = await openrouter.chat.send({
      chatRequest: {
        model: 'openrouter/owl-alpha',
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        stream: false,
      },
    });
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
