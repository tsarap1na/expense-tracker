import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
  .setTitle('Expense Tracker')
  .setDescription('Expense Tracker API')
  .setVersion('1.0')
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT);
  await app.listen(port);
  console.log(`App is running on http://localhost:${port}`);
  console.log(`Swagger is running on http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Failed to start app:', err);
  process.exit(1);
});
