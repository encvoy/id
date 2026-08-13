import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const MTLS_KEY = 'mtls';

export interface MtlsInfo {
  verify: string;
  dn: string;
  cn: string;
  issuer: string;
  serial: string;
  fingerprint: string;
  cert: string;
}

export const Mtls = createParamDecorator<MtlsInfo>((data: unknown, context: ExecutionContext) => {
  const request = context
    .switchToHttp()
    .getRequest<Request & Record<typeof MTLS_KEY, MtlsInfo | null | undefined>>();
  return request?.[MTLS_KEY] ?? null;
});
