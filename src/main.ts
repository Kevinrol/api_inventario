import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = 3000

  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no definidos
      forbidNonWhitelisted: true, // error si mandan extras
      transform: true, // convierte tipos automáticamente
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Stock')
    .setDescription('Documentación de la API de Stock y Proveedores')
    .setVersion('1.0')
    .build();
    
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
  console.log(`Swagger UI is running on: http://localhost:${PORT}/api`);
}
bootstrap();
