import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('DailyPlannerAPI');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js frontend and Tauri desktop
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Daily Planner Core Backend running on: http://localhost:${port}`);
  logger.log(`⚡ WebSocket gateway active on port ${port}`);
}

bootstrap();
