import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  });

  // Global prefix & versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('AegisPay AI API')
    .setDescription(
      '🛡️ AegisPay AI — Programmable Trust for Every Transaction\n\n' +
        'Complete API documentation for the AegisPay escrow and settlement platform.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication & authorization endpoints')
    .addTag('Escrow', 'Escrow engine — lock, release, refund funds')
    .addTag('Orders', 'Order lifecycle management')
    .addTag('Settlement', 'Settlement rules engine')
    .addTag('Fraud', 'Fraud detection & case management')
    .addTag('Trust', 'Trust score engine')
    .addTag('Insurance', 'Micro insurance pool')
    .addTag('Evidence', 'Immutable evidence vault')
    .addTag('Notifications', 'Notification management')
    .addTag('Analytics', 'Platform analytics & metrics')
    .addTag('Admin', 'Admin portal endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AegisPay AI — API Docs',
  });

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         AegisPay AI — Backend API            ║
  ║   "Programmable Trust for Every Transaction" ║
  ╠══════════════════════════════════════════════╣
  ║  API:      http://localhost:${port}/api/v1       ║
  ║  Docs:     http://localhost:${port}/api/docs      ║
  ║  Mode:     ${process.env.NODE_ENV || 'development'}                      ║
  ╚══════════════════════════════════════════════╝
  `);
}

bootstrap();
