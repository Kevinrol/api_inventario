import { Test, TestingModule } from '@nestjs/testing';
import { ComprasProveedoresService } from './compras-proveedores.service';

describe('ComprasProveedoresService', () => {
  let service: ComprasProveedoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComprasProveedoresService],
    }).compile();

    service = module.get<ComprasProveedoresService>(ComprasProveedoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
