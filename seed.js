const bcrypt = require('bcryptjs');
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

const USUARIOS = [
  ['Desarrollador Sistema', 'dev', 'dev', 'SUPER_ADMIN', 'tiempo_completo'],
  ['Nelly Mamani', 'nelly', 'tofor$2026', 'ADMIN', 'tiempo_completo'],
  ['Rodrigo Quispe Choque', 'rquispe', 'tofor123', 'VENDEDOR', 'mañana'],
  ['Paola Condori Apaza', 'pcondori', 'tofor123', 'VENDEDOR', 'tarde'],
  ['Cristian Flores Nina', 'cflores', 'tofor123', 'VENDEDOR', 'tiempo_completo'],
  ['Tatiana Huanca Limachi', 'thuanca', 'tofor123', 'VENDEDOR', 'mañana'],
  ['Jhonatan Ticona Yujra', 'jticona', 'tofor123', 'VENDEDOR', 'tarde'],
  ['Valeria Callisaya Copa', 'vcallisaya', 'tofor123', 'VENDEDOR', 'tiempo_completo'],
  ['Marco Antonio Villca', 'mvillca', 'tofor123', 'VENDEDOR', 'mañana'],
  ['Gabriela Mamani Catari', 'gmamani', 'tofor123', 'VENDEDOR', 'tarde'],
];

const MARCAS = [
  'Faber-Castell', 'Artesco', 'Top', 'Staedtler', 'BIC', 'Pelikan',
  'Norma', 'Pilot', 'Stabilo', 'Maped', 'Kores', 'Editorial Don Bosco',
];

const LINEAS = [
  'Cuadernos', 'Adhesivos', 'Pinturas', 'Lápices y Colores',
  'Bolígrafos y Marcadores', 'Textos/Libros', 'Geometría y Dibujo', 'Papelería y Oficina',
];

const PROVEEDORES = [
  {
    nit: '1020345021', razon_social: 'Distribuidora Escolar Mamani S.R.L.',
    nombre_contacto: 'Juan Carlos Mamani Quispe', telefono_contacto: '71234567', ciudad: 'La Paz',
    marcas: ['Faber-Castell', 'Staedtler', 'Maped'],
    lineas: ['Lápices y Colores', 'Geometría y Dibujo'],
  },
  {
    nit: '1023456789', razon_social: 'Importadora Andina Condori Ltda.',
    nombre_contacto: 'Rosa Elena Condori Apaza', telefono_contacto: '72345678', ciudad: 'El Alto',
    marcas: ['Artesco', 'Top', 'Norma'],
    lineas: ['Cuadernos', 'Papelería y Oficina'],
  },
  {
    nit: '3045678012', razon_social: 'Papelera Cochabamba S.A.',
    nombre_contacto: 'Luis Alberto Rojas Camacho', telefono_contacto: '70456789', ciudad: 'Cochabamba',
    marcas: ['Norma', 'Kores', 'Pelikan'],
    lineas: ['Cuadernos', 'Adhesivos', 'Pinturas'],
  },
  {
    nit: '1056789034', razon_social: 'Comercial Huanca & Hnos.',
    nombre_contacto: 'Marcelo Huanca Choque', telefono_contacto: '73567890', ciudad: 'La Paz',
    marcas: ['BIC', 'Pilot', 'Stabilo'],
    lineas: ['Bolígrafos y Marcadores'],
  },
  {
    nit: '4067890123', razon_social: 'Distribuciones Oriente Cruceño S.R.L.',
    nombre_contacto: 'Patricia Suárez Justiniano', telefono_contacto: '77678901', ciudad: 'Santa Cruz',
    marcas: ['Faber-Castell', 'Pelikan', 'Top'],
    lineas: ['Pinturas', 'Adhesivos'],
  },
  {
    nit: '1078901256', razon_social: 'Librería Mayorista Titicaca',
    nombre_contacto: 'Fernando Colque Nina', telefono_contacto: '76789012', ciudad: 'El Alto',
    marcas: ['Editorial Don Bosco', 'Norma'],
    lineas: ['Textos/Libros', 'Cuadernos'],
  },
];

const PRODUCTOS = [
  ['7770001000011', 'Lápiz Grafito HB x12', 18.00, 120, 30, 'Faber-Castell', 'Lápices y Colores'],
  ['7770001000028', 'Caja de Colores Largos x12', 22.00, 90, 25, 'Faber-Castell', 'Lápices y Colores'],
  ['7770001000035', 'Caja de Colores Largos x24', 38.00, 60, 20, 'Faber-Castell', 'Lápices y Colores'],
  ['7770001000042', 'Lápiz Jumbo Triangular', 3.50, 200, 50, 'Staedtler', 'Lápices y Colores'],
  [null, 'Colores Triplus x12', 30.00, 45, 15, 'Staedtler', 'Lápices y Colores'],
  ['7770002000019', 'Cuaderno Universitario 100 hojas Cuadriculado', 12.00, 150, 40, 'Artesco', 'Cuadernos'],
  ['7770002000026', 'Cuaderno Universitario 100 hojas Rayado', 12.00, 150, 40, 'Artesco', 'Cuadernos'],
  ['7770002000033', 'Cuaderno Tapa Dura 200 hojas', 25.00, 70, 20, 'Top', 'Cuadernos'],
  ['7770002000040', 'Cuaderno Pautado Caligrafía 50 hojas', 6.00, 180, 50, 'Norma', 'Cuadernos'],
  [null, 'Cuaderno Espiral A4 Cuadriculado', 15.00, 80, 25, 'Norma', 'Cuadernos'],
  ['7770003000012', 'Bolígrafo Cristal Azul (unidad)', 2.00, 400, 100, 'BIC', 'Bolígrafos y Marcadores'],
  ['7770003000029', 'Bolígrafo Cristal Negro (unidad)', 2.00, 350, 100, 'BIC', 'Bolígrafos y Marcadores'],
  ['7770003000036', 'Bolígrafo G2 Gel 0.7', 8.00, 120, 30, 'Pilot', 'Bolígrafos y Marcadores'],
  ['7770003000043', 'Marcador Permanente Negro', 6.00, 100, 30, 'Pilot', 'Bolígrafos y Marcadores'],
  ['7770003000050', 'Resaltador Boss Amarillo', 7.50, 90, 25, 'Stabilo', 'Bolígrafos y Marcadores'],
  [null, 'Set Resaltadores x4 colores', 28.00, 40, 10, 'Stabilo', 'Bolígrafos y Marcadores'],
  ['7770004000015', 'Témperas x6 colores 20ml', 20.00, 60, 15, 'Pelikan', 'Pinturas'],
  ['7770004000022', 'Acuarelas x12 colores', 25.00, 55, 15, 'Pelikan', 'Pinturas'],
  ['7770004000039', 'Pincel Nro. 6', 4.00, 150, 40, 'Artesco', 'Pinturas'],
  [null, 'Pintura Acrílica 60ml Blanco', 12.00, 50, 15, 'Top', 'Pinturas'],
  ['7770005000018', 'Goma Líquida 40ml', 5.00, 140, 40, 'Pelikan', 'Adhesivos'],
  ['7770005000025', 'Pegamento en Barra 21g', 6.50, 130, 35, 'Kores', 'Adhesivos'],
  ['7770005000032', 'Cinta Adhesiva Transparente 18mm', 4.00, 200, 50, 'Top', 'Adhesivos'],
  ['7770005000049', 'Silicona Líquida 100ml', 9.00, 70, 20, 'Pelikan', 'Adhesivos'],
  ['7770006000011', 'Juego de Geometría 4 piezas', 10.00, 80, 20, 'Maped', 'Geometría y Dibujo'],
  ['7770006000028', 'Compás Escolar', 14.00, 60, 15, 'Maped', 'Geometría y Dibujo'],
  ['7770006000035', 'Regla Plástica 30cm', 3.00, 180, 50, 'Maped', 'Geometría y Dibujo'],
  ['7770007000014', 'Lenguaje y Comunicación 3ro Secundaria', 85.00, 25, 8, 'Editorial Don Bosco', 'Textos/Libros'],
  ['7770007000021', 'Matemática 4to Secundaria', 90.00, 20, 8, 'Editorial Don Bosco', 'Textos/Libros'],
  [null, 'Atlas Geográfico de Bolivia', 65.00, 15, 5, 'Editorial Don Bosco', 'Textos/Libros'],
  ['7770008000017', 'Papel Bond Carta Resma 500 hojas', 38.00, 50, 15, 'Top', 'Papelería y Oficina'],
  ['7770008000024', 'Folder Manila Oficio (paquete x25)', 20.00, 40, 10, 'Norma', 'Papelería y Oficina'],
  ['7770008000031', 'Corrector Líquido 20ml', 5.00, 110, 30, 'Kores', 'Papelería y Oficina'],
];

const CLIENTES = [
  ['Librería “El Estudiante” de Rosmery Limachi Mamani', '4523189', '71122334', 'Av. 6 de Marzo Nro. 450, Zona 16 de Julio, El Alto', 'Mayorista'],
  ['Papelería Escolar Choque', '5012876', '72233445', 'Calle Murillo Nro. 233, Zona Central, La Paz', 'Mayorista'],
  ['Librería y Papelería “Villca”', '3387654', '73344556', 'Av. Panamericana Nro. 1200, Ciudad Satélite, El Alto', 'Mayorista'],
  ['Comercial Quispe e Hijos', '1034567028', '74455667', 'Calle Comercio Nro. 890, Zona San Pedro, La Paz', 'Mayorista'],
  ['Librería “El Saber” de Eduardo Callisaya Apaza', '6178934', '75566778', 'Av. Juan Pablo II Nro. 320, Villa Adela, El Alto', 'Mayorista'],
  ['Papelería “La Escuelita” de Marleny Copa Flores', '4890123', '76677889', 'Calle Illampu Nro. 150, Zona Norte, La Paz', 'Mayorista'],
  ['Carmen Rosa Yujra Ticona', '7234561', '77788990', 'Calle 3 Nro. 45, Zona Villa Dolores, El Alto', 'Mayorista'],
  ['Roberto Gutiérrez Mendoza', '3456123', '70899001', 'Av. Buenos Aires Nro. 780, La Paz', 'Mayorista'],
  ['Unidad Educativa “Mariscal Sucre”', '1015678034', '22456789', 'Av. Camacho Nro. 1100, La Paz', 'Mayorista'],
  ['Daniela Nina Vargas', '8123456', '71011223', 'Calle Sagárnaga Nro. 210, La Paz', 'Mayorista'],
  ['Wilson Apaza Condori', '5678901', '72122334', 'Av. Cívica Nro. 560, Zona Ceja, El Alto', 'Mayorista'],
  ['Librería “Kantuta” de Silvia Huanca Rojas', '4412345', '73233445', 'Av. Bolivia Nro. 98, Zona Rosas Pampa, El Alto', 'Mayorista'],
];

async function seed() {
  await knex.transaction(async (trx) => {
    await trx.raw(`
      TRUNCATE TABLE
        detalle_ventas, ventas,
        detalle_compras_proveedores, compras_proveedores,
        detalle_pedidos_proveedor, pedidos_proveedor,
        proveedor_marcas, proveedor_lineas,
        productos, proveedores, marcas, lineas_productos, clientes, usuarios
      RESTART IDENTITY CASCADE;
    `);

    await trx('usuarios').insert(
      USUARIOS.map(([nombre_completo, username, pass, rol, turno]) => ({
        nombre_completo,
        username,
        password_hash: bcrypt.hashSync(pass, 10),
        rol,
        turno,
        estado: true,
      }))
    );

    const marcasRows = await trx('marcas')
      .insert(MARCAS.map((nombre_marca) => ({ nombre_marca })))
      .returning(['id_marca', 'nombre_marca']);
    const marcaId = Object.fromEntries(marcasRows.map((m) => [m.nombre_marca, m.id_marca]));

    const lineasRows = await trx('lineas_productos')
      .insert(LINEAS.map((nombre_linea) => ({ nombre_linea })))
      .returning(['id_linea', 'nombre_linea']);
    const lineaId = Object.fromEntries(lineasRows.map((l) => [l.nombre_linea, l.id_linea]));

    for (const p of PROVEEDORES) {
      const [{ id_proveedor }] = await trx('proveedores')
        .insert({
          nit: p.nit,
          razon_social: p.razon_social,
          nombre_contacto: p.nombre_contacto,
          telefono_contacto: p.telefono_contacto,
          ciudad: p.ciudad,
          estado: true,
        })
        .returning(['id_proveedor']);

      await trx('proveedor_marcas').insert(
        p.marcas.map((m) => ({ id_proveedor, id_marca: marcaId[m] }))
      );
      await trx('proveedor_lineas').insert(
        p.lineas.map((l) => ({ id_proveedor, id_linea: lineaId[l] }))
      );
    }

    await trx('productos').insert(
      PRODUCTOS.map(([codigo_barras, nombre_producto, precio, stock_actual, stock_minimo, marca, linea]) => ({
        codigo_barras,
        nombre_producto,
        precio,
        stock_actual,
        stock_minimo,
        id_marca: marcaId[marca],
        id_linea: lineaId[linea],
        estado: true,
      }))
    );

    await trx('clientes').insert(
      CLIENTES.map(([razon_social_nombre, nit_ci, telefono, direccion, tipo_cliente]) => ({
        razon_social_nombre,
        nit_ci,
        telefono,
        direccion,
        tipo_cliente,
        estado: true,
      }))
    );
  });

  console.log('Seed completado: 10 usuarios, 12 marcas, 8 líneas, 6 proveedores, 33 productos y 12 clientes.');
  await knex.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
