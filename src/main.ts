import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Use Socket.IO for WebSocket gateway (admin new_order notifications)
  app.useWebSocketAdapter(new IoAdapter(app));
  // Enable CORS for API testing tools (Postman, Insomnia, etc.)
  app.enableCors();
  // Enable validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger / OpenAPI documentation at /api
  const config = new DocumentBuilder()
    .setTitle('Project API')
    .setDescription(
      'API for users, orders, and health checks. WebSocket: admin namespace emits `new_order` on order create.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // listen on all interfaces to allow external access
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api`);
}
bootstrap();
