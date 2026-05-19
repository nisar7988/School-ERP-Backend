import { Controller } from '@nestjs/common';
import { AiService } from './ai.service';
import { Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth('access-token')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}
  @Get()
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  async ask(@Query('q') query: string) {
    const result = await this.aiService.askAI(query);
    return { response: result };
  }
}
