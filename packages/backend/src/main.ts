import { HttpException, HttpStatus, LogLevel, ValidationError } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common/pipes';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, Request, Response } from 'express';
import { join } from 'path';
import * as constants from './constants';
import { ExtensionsLoader } from './loader';
import { CustomLogger, RootModule } from './modules';

export let app: NestExpressApplication;

async function initializeApp() {
  // Load extensions
  const extensionsModules = [
    ...(await ExtensionsLoader.load('./extensions')),
    ...(await ExtensionsLoader.load('./modules/providers/collection')),
  ];

  // Dynamically register modules
  const AppDynamicModule = RootModule.register(extensionsModules);

  app = await NestFactory.create<NestExpressApplication>(AppDynamicModule, {
    logger: constants.CONSOLE_LOG_LEVELS as LogLevel[],
  });

  const staticPath = join(process.cwd(), 'views');
  app.useStaticAssets(staticPath);
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  app.useStaticAssets(join(__dirname, '..', 'auth'), {
    prefix: '/auth/',
  });
  app.useStaticAssets(join(__dirname, '..', 'views', 'docs'), {
    prefix: '/docs/',
  });
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.use(json({ limit: '2mb' }));
  app.use(cookieParser());
  app.useLogger(app.get(CustomLogger));
  app.setGlobalPrefix('/api');
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new HttpException(
          validationErrors.reduce((acc, validationError) => {
            let childrenErrors: string;
            if (validationError.children) {
              childrenErrors = validationError.children.reduce((acc, validationError, index) => {
                return (acc +=
                  (index ? ', ' : '') +
                  Object.values(validationError.constraints || {}).join(', '));
              }, '');
            }

            const errors = Object.values(validationError.constraints || {});
            if (childrenErrors) errors.push(childrenErrors);

            if (errors.length) {
              acc += acc ? ', ' : '';
              acc += errors.join(', ');
            }

            return acc;
          }, ''),
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  app.enableCors({
    origin: [constants.DOMAIN],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: [
      'Access-Control-Allow-Origin',
      'X-Total-Count',
      'X-Per-Page',
      'X-Current-Offset',
      'X-Next-Offset',
    ],
    credentials: true,
    maxAge: 3600,
  });

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trusted')
    .setDescription('Trusted service')
    .setVersion(`v${constants.VERSION}`)
    .addBasicAuth()
    .addBearerAuth()
    .addOAuth2()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1, // Disables displaying the list of all types
      docExpansion: 'none', // Swagger UI collapsed by default
      filter: true, // Enable filtering
      showRequestDuration: true, // Show request duration
    },
  });

  // Документация
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/docs', (_req: Request, res: Response): void => {
    res.render('docs', {
      version: constants.VERSION,
    });
  });

  if (constants.NODE_ENV === 'development') {
    console.warn('Server is running in development mode');
  }

  await app.listen(3005);

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[BACKEND] Received ${signal}, closing server gracefully...`);
    await app.close();
    console.log('[BACKEND] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
initializeApp();
