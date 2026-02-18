import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const MTLS_KEY = 'mtls';

export interface MtlsInfo {
  verify: string;
  dn: string;
  serial: string;
  fingerprint: string;
  cert: string;
}

export const Mtls = createParamDecorator<MtlsInfo>((data: unknown, context: ExecutionContext) => {
  return Reflect.getMetadata(MTLS_KEY, context.getHandler());
});
