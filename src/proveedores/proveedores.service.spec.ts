import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresService } from './proveedores.service';
import { KNEX_CONNECTION } from '../database/database.provider';
import { NotFoundException } from '@nestjs/common';

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  
  // Simulamos el Query Builder de Knex
  const mockQueryBuilder = {
    insert: jest.fn(),
    select: jest.fn(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    update: jest.fn(),
    del: jest.fn(),
  };

  // Simulamos la función de Knex que devuelve el Query Builder
  const mockKnex = jest.fn().mockReturnValue(mockQueryBuilder);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        {
          provide: KNEX_CONNECTION,
          useValue: mockKnex,
        },
      ],
    }).compile();

    service = module.get<ProveedoresService>(ProveedoresService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un nuevo proveedor', async () => {
      const createDto = { nombre: 'Proveedor A', nit: '123' };
      const createdRecord = { id: 1, ...createDto };
      
      mockQueryBuilder.insert.mockResolvedValue([1]);
      mockQueryBuilder.first.mockResolvedValue(createdRecord);

      const result = await service.create(createDto as any);

      expect(mockKnex).toHaveBeenCalledWith('proveedores');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdRecord);
    });
  });

  describe('findAll', () => {
    it('debería devolver un arreglo de proveedores', async () => {
      const records = [{ id: 1, nombre: 'Proveedor A' }];
      mockQueryBuilder.select.mockResolvedValue(records);

      const result = await service.findAll();

      expect(mockKnex).toHaveBeenCalledWith('proveedores');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(records);
    });
  });

  describe('findOne', () => {
    it('debería devolver un proveedor por ID', async () => {
      const record = { id: 1, nombre: 'Proveedor A' };
      mockQueryBuilder.first.mockResolvedValue(record);

      const result = await service.findOne(1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(record);
    });

    it('debería devolver null si el proveedor no existe', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debería actualizar y devolver el proveedor actualizado', async () => {
      const updateDto = { nombre: 'Proveedor Editado' };
      const updatedRecord = { id: 1, nombre: 'Proveedor Editado' };

      mockQueryBuilder.update.mockResolvedValue(1);
      mockQueryBuilder.first.mockResolvedValue(updatedRecord);

      const result = await service.update(1, updateDto as any);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateDto);
      expect(result).toEqual(updatedRecord);
    });

    it('debería lanzar NotFoundException si no encuentra al actualizar', async () => {
      mockQueryBuilder.update.mockResolvedValue(1);
      mockQueryBuilder.first.mockResolvedValue(undefined);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería eliminar el proveedor', async () => {
      const record = { id: 1, nombre: 'Proveedor A' };
      mockQueryBuilder.first.mockResolvedValue(record);
      mockQueryBuilder.del.mockResolvedValue(1);

      const result = await service.remove(1);

      expect(mockQueryBuilder.del).toHaveBeenCalled();
      expect(result).toEqual(record);
    });

    it('debería lanzar NotFoundException si el proveedor a eliminar no existe', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
