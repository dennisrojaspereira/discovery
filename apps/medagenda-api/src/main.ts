import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados nos DTOs
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.MEDAGENDA_API_PORT ?? 3002);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MedAgenda API ouvindo em http://localhost:${port}/api`);
}

bootstrap();
