import { Test, TestingModule } from '@nestjs/testing';
import { ComprasProveedoresController } from './compras-proveedores.controller';

describe('ComprasProveedoresController', () => {
  let controller: ComprasProveedoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComprasProveedoresController],
    }).compile();

    controller = module.get<ComprasProveedoresController>(ComprasProveedoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
