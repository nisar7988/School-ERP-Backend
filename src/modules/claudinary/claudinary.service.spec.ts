import { Test, TestingModule } from '@nestjs/testing';
import { ClaudinaryService } from './claudinary.service';

describe('ClaudinaryService', () => {
  let service: ClaudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaudinaryService],
    }).compile();

    service = module.get<ClaudinaryService>(ClaudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
