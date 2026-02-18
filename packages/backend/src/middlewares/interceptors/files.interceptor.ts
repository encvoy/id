import * as common from '@nestjs/common';
import multer, { Multer } from 'multer';
import { Observable } from 'rxjs';
import path from 'path';
import { Ei18nCodes } from 'src/enums';

const MULTER_MODULE_OPTIONS = 'MULTER_MODULE_OPTIONS';
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.webp'];

export function FilesInterceptor(
  dest: string,
  ...fields: {
    fileRequired?: boolean;
    fieldName: string;
    /**
     * File size in bytes, default 1MB
     */
    size?: number;
  }[]
): common.Type<common.NestInterceptor> {
  class MixinInterceptor implements common.NestInterceptor {
    protected multer: Multer;

    constructor(
      @common.Optional()
      @common.Inject(MULTER_MODULE_OPTIONS)
      options: multer.Options = {},
    ) {
      this.multer = multer({
        ...options,
        storage: multer.diskStorage({
          destination: dest,
        }),
        fileFilter: (req, file, callback) => {
          const ext = path.extname(file.originalname).toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(ext)) {
            //@ts-ignore
            req.fileValidationError = `Incorrect file type: ${ext}`;
            return callback(null, false);
          }
          callback(null, true);
        },
      });
    }

    async intercept(
      context: common.ExecutionContext,
      next: common.CallHandler,
    ): Promise<Observable<any>> {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest();

      await new Promise<void>((resolve, reject) => {
        this.multer.fields(
          fields.map((field) => ({
            name: field.fieldName,
            maxCount: 1,
          })),
        )(req, ctx.getResponse(), (err: any) => {
          if (err) {
            return reject(this.transformException(err));
          }

          // Checking required files
          for (const field of fields) {
            if (field.fileRequired && (!req.files || !req.files[field.fieldName])) {
              return reject(
                new common.BadRequestException(Ei18nCodes.T3E0081, { cause: field.fieldName }),
              );
            }
          }

          // Checking file sizes
          for (const field of fields) {
            if (req.files && req.files[field.fieldName]) {
              const file = req.files[field.fieldName][0];
              if (file.size > (field.size || 1024 * 1024)) {
                return reject(
                  new common.PayloadTooLargeException(Ei18nCodes.T3E0083, {
                    cause: field.fieldName,
                  }),
                );
              }
            }
          }

          // Checking file validation errors
          if (req.fileValidationError) {
            return reject(new common.BadRequestException(req.fileValidationError));
          }

          resolve();
        });
      });

      return next.handle();
    }

    private transformException(error: Error | undefined) {
      if (!error) return error;
      switch (error.message) {
        case 'File too large':
          return new common.PayloadTooLargeException(error.message);
        case 'Unexpected field':
          return new common.BadRequestException(error.message);
        default:
          return new common.BadRequestException(error.message);
      }
    }
  }

  const Interceptor = common.mixin(MixinInterceptor);
  return Interceptor;
}
