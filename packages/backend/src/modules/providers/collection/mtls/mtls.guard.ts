import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { MTLS_KEY } from './mtls.decorator';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class MtlsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    Reflect.defineMetadata(MTLS_KEY, null, context.getHandler());

    const clientVerify = request.headers['x-ssl-client-verify'] as string;
    const clientDn = request.headers['x-ssl-client-dn'] as string;
    const clientSerial = request.headers['x-ssl-client-serial'] as string;
    const clientFingerprint = request.headers['x-ssl-client-fingerprint'] as string;
    const clientIssuer = request.headers['x-ssl-client-issuer'] as string;
    const clientCert = request.headers['x-ssl-client-cert'] as string;
    const clientCertEscaped = request.headers['x-ssl-client-cert-escaped'] as string;

    if (clientSerial) {
      if (clientVerify !== 'SUCCESS') {
        throw new ForbiddenException(Ei18nCodes.T3E0053);
      }
      const cert = clientCertEscaped || encodeURIComponent(clientCert || '');
      Reflect.defineMetadata(
        MTLS_KEY,
        {
          verify: clientVerify,
          dn: clientDn,
          serial: clientSerial,
          fingerprint: clientFingerprint,
          issuer: clientIssuer,
          cert,
        },
        context.getHandler(),
      );
    }

    return true;
  }
}
