import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  const frontendUrl = configService.get<string>('frontend.url');

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3002',
      'http://103.179.45.218:3002',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NST Finance API')
    .setDescription('Backend API for NST Finance DApp')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .addTag('donations', 'Donation tracking endpoints')
    .addTag('nodes', 'Node management endpoints')
    .addTag('referrals', 'Referral system endpoints')
    .addTag('rewards', 'NST rewards endpoints')
    .addTag('leaderboard', 'Leaderboard endpoints')
    .addTag('airdrops', 'Airdrop system endpoints')
    .addTag('stats', 'Platform statistics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port || 3003);
  console.log(`🚀 NST Finance API running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();