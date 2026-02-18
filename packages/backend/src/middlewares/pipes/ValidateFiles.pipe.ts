import { PipeTransform, HttpException, HttpStatus } from '@nestjs/common';

export class ValidateFilesPipe implements PipeTransform {
  constructor(
    public validation: {
      [filename: string]: number;
    },
  ) {}

  async transform(files: { [fieldname: string]: Express.Multer.File[] } | any) {
    if (Object.values(files)?.[0]?.[0]?.filename) {
      const filenames = Object.keys(this.validation);
      for (const filename of filenames) {
        if (files[filename]?.[0].size > this.validation[filename]) {
          return Promise.reject(
            new HttpException('Exceeded the allowed image size', HttpStatus.UNPROCESSABLE_ENTITY),
          );
        }
      }
    }

    return files;
  }
}
