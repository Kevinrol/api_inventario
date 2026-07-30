import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';

describe('ProveedoresController', () => {
  let controller: ProveedoresController;
  let service: ProveedoresService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProveedoresController],
      providers: [
        {
          provide: ProveedoresService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProveedoresController>(ProveedoresController);
    service = module.get<ProveedoresService>(ProveedoresService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() debería llamar al servicio con el DTO', async () => {
    const dto = { nombre: 'Test', nit: '123' };
    mockService.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('findAll() debería llamar al servicio y retornar un array', async () => {
    const arr = [{ id: 1, nombre: 'Test' }];
    mockService.findAll.mockResolvedValue(arr);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual(arr);
  });

  it('findOne() debería parsear el id y llamar al servicio', async () => {
    mockService.findOne.mockResolvedValue({ id: 1, nombre: 'Test' });

    await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('update() debería parsear el id, mandar el DTO y llamar al servicio', async () => {
    const dto = { nombre: 'Update' };
    mockService.update.mockResolvedValue({ id: 1, ...dto });

    await controller.update('1', dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove() debería parsear el id y llamar al servicio', async () => {
    mockService.remove.mockResolvedValue({ id: 1, nombre: 'Deleted' });

    await controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
