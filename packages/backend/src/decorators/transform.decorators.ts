// Transform is used for correct handling of Boolean or Array values sent via Swagger
// Using @ApiConsumes('multipart/form-data') converts all values to String
import { Transform } from 'class-transformer';

export function TransformToArray() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    } else return value;
  });
}

export function TransformToBoolean() {
  return Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value));
}

export function TransformToNumber() {
  return Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value));
}

export function TransformFromEncodeURI() {
  return Transform((param) => decodeURIComponent(param.value));
}
