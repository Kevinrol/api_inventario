import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresService } from './proveedores.service';
import { KNEX_CONNECTION } from '../database/database.provider';
import knex, { Knex } from 'knex';

describe('Proveedores Integration Test (tofor_test)', () => {
  let service: ProveedoresService;
  let db: Knex;

  beforeAll(async () => {
    // 1. Inicializamos la conexión real hacia tofor_test
    db = knex({
      client: 'mysql2',
      connection: {
        host: 'localhost',
        user: 'root', // Ajustar según credenciales locales
        password: '', // Ajustar según credenciales locales
        database: 'tofor_test',
      },
    });

    // 2. Creamos el módulo de testing inyectando la conexión real
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        {
          provide: KNEX_CONNECTION,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<ProveedoresService>(ProveedoresService);
  });

  beforeEach(async () => {
    // Limpiamos la tabla antes de cada prueba para asegurar un entorno aislado.
    await db('proveedores').delete(); 
  });

  afterAll(async () => {
    // Es muy importante cerrar la conexión de Knex al finalizar todos los tests
    await db.destroy();
  });

  describe('CRUD de Proveedores en Base de Datos Real', () => {
    it('debería insertar un proveedor correctamente', async () => {
      const nuevoProveedor = {
        nit: '123456789',
        razon_social: 'Empresa Test SA',
        nombre: 'Juan Perez',
        telefono_contacto: '555-1234',
        estado: 'activo'
      };

      const result = await service.create(nuevoProveedor as any);

      // Verificamos el resultado del servicio
      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.nit).toBe(nuevoProveedor.nit);

      // Verificamos de forma independiente consultando directamente a la BD
      const enBaseDeDatos = await db('proveedores').where({ id: result.id }).first();
      expect(enBaseDeDatos).toBeDefined();
      expect(enBaseDeDatos.razon_social).toBe('Empresa Test SA');
    });

    it('debería retornar todos los proveedores insertados', async () => {
      // Insertamos 2 registros directo por knex
      await db('proveedores').insert([
        { nit: '111', razon_social: 'Prov 1', nombre: 'Contacto 1' },
        { nit: '222', razon_social: 'Prov 2', nombre: 'Contacto 2' },
      ]);

      const proveedores = await service.findAll();
      
      expect(proveedores.length).toBeGreaterThanOrEqual(2);
      expect(proveedores.map(p => p.nit)).toEqual(expect.arrayContaining(['111', '222']));
    });

    it('debería actualizar un registro existente', async () => {
      // Insertamos registro inicial
      const [id] = await db('proveedores').insert({ 
        nit: '999', 
        razon_social: 'Original', 
        nombre: 'Pedro' 
      });

      const actualizacion = { razon_social: 'Modificado' };

      const result = await service.update(id, actualizacion as any);

      expect(result.razon_social).toBe('Modificado');

      // Validar también que en base de datos cambió
      const enBaseDeDatos = await db('proveedores').where({ id }).first();
      expect(enBaseDeDatos.razon_social).toBe('Modificado');
    });

    it('debería eliminar un proveedor de la tabla', async () => {
      const [id] = await db('proveedores').insert({ 
        nit: '444', 
        razon_social: 'A Eliminar', 
        nombre: 'Lucas' 
      });

      await service.remove(id);

      // Validar que ya no existe en la base de datos
      const enBaseDeDatos = await db('proveedores').where({ id }).first();
      expect(enBaseDeDatos).toBeUndefined();
    });
  });
});
