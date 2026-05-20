import { Controller, Get, Query, Res, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import * as express from 'express';

@ApiTags('ai')
@ApiBearerAuth('access-token')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}
  
  @Get()
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async ask(@Query('q') query: string, @Req() req) {
    const user = req.user;
    const result = await this.aiService.askAI(query, user?.role, user?.userId);
    return { response: result };
  }

  @Get('stream')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async stream(@Query('q') query: string, @Req() req, @Res() res: express.Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const user = req.user;
    try {
      for await (const chunk of this.aiService.streamAI(query, user?.role, user?.userId)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();
    } catch (err: any) {
      console.error('Streaming error:', err);
      res.write(`data: ${JSON.stringify(`[ERROR: ${err.message || 'Streaming failed'}]`)}\n\n`);
      res.end();
    }
  }
}
