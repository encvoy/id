import { HttpException, HttpStatus, LogLevel, ValidationError } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common/pipes';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { join } from 'path';
import * as constants from './constants';
import { CustomLogger, RootModule } from './modules';
import { runWithBootstrapRetry } from './utils/bootstrap-retry';
import { annotateRequiredScopes } from './utils/swagger-scopes';

let app: NestExpressApplication;
let shutdownHandlersRegistered = false;

const sendHealth = (_req: any, res: any) => {
  res.status(200).json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
};

const collectValidationMessages = (validationErrors: ValidationError[] = []): string[] => {
  return validationErrors.flatMap((validationError) => {
    const ownErrors = Object.values(validationError.constraints || {});
    const nestedErrors = collectValidationMessages(validationError.children || []);
    return [...ownErrors, ...nestedErrors];
  });
};

async function initializeApp(): Promise<NestExpressApplication> {
  let nextApp: NestExpressApplication | undefined;

  try {
    const AppDynamicModule = RootModule.register();

    nextApp = await NestFactory.create<NestExpressApplication>(AppDynamicModule, {
      logger: constants.CONSOLE_LOG_LEVELS as LogLevel[],
    });

    nextApp.getHttpAdapter().get('/health', sendHealth);
    nextApp.getHttpAdapter().get('/api/health', sendHealth);

    const staticPath = join(process.cwd(), 'views');
    nextApp.useStaticAssets(staticPath);
    nextApp.useStaticAssets(join(__dirname, '..', 'public'), {
      prefix: '/public/',
    });
    nextApp.useStaticAssets(join(__dirname, '..', 'auth'), {
      prefix: '/auth/',
    });
    nextApp.setBaseViewsDir(join(__dirname, '..', 'views'));
    nextApp.setViewEngine('hbs');
    nextApp.use(json({ limit: '2mb' }));
    nextApp.use(cookieParser());
    nextApp.useLogger(nextApp.get(CustomLogger));
    nextApp.setGlobalPrefix('/api');
    nextApp.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
        transform: true,
        exceptionFactory: (validationErrors: ValidationError[] = []) => {
          return new HttpException(
            collectValidationMessages(validationErrors).join(', '),
            HttpStatus.BAD_REQUEST,
          );
        },
      }),
    );

    nextApp.enableCors({
      origin: [new URL(constants.DOMAIN).origin],
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

    nextApp.enableShutdownHooks();

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Trusted')
      .setDescription('Trusted service')
      .setVersion(`v${constants.VERSION}`)
      .addBasicAuth()
      .addBearerAuth()
      .addOAuth2()
      .build();

    const document = SwaggerModule.createDocument(nextApp, swaggerConfig);
    annotateRequiredScopes(document);
    SwaggerModule.setup('api', nextApp, document, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1, // Disables displaying the list of all types
        docExpansion: 'none', // Swagger UI collapsed by default
        filter: true, // Enable filtering
        showRequestDuration: true, // Show request duration
      },
    });

    if (constants.NODE_ENV === 'development') {
      console.warn('Server is running in development mode');
    }

    await nextApp.listen(3005);
    app = nextApp;
    return nextApp;
  } catch (error) {
    if (nextApp) {
      await nextApp.close().catch(() => undefined);
    }

    throw error;
  }
}

const registerShutdownHandlers = () => {
  if (shutdownHandlersRegistered) {
    return;
  }

  shutdownHandlersRegistered = true;

  const gracefulShutdown = async (signal: string) => {
    console.info(`[Shutdown] Received ${signal}`);
    await app?.close().catch(() => undefined);
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

async function bootstrap() {
  await runWithBootstrapRetry({
    taskName: 'backend startup',
    task: async () => {
      await initializeApp();
      registerShutdownHandlers();
    },
  });
}

void bootstrap();
