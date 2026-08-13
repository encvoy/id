import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { MTLS_KEY } from './mtls.decorator';
import { Ei18nCodes } from 'src/enums';

function decodeDnField(value: string | undefined): string {
  if (!value) return '';

  // \XX hex-sequences
  if (/\\[0-9A-Fa-f]{2}/.test(value)) {
    try {
      return decodeURIComponent(value.replace(/\\([0-9A-Fa-f]{2})/g, '%$1'));
    } catch {
      return value;
    }
  }

  // %XX
  if (/%[0-9A-Fa-f]{2}/.test(value)) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  // Latin-1 as UTF-8: Node.js 0x80–0xFF ('Ð', '¢', 'Ñ').
  if (/[\x80-\xFF]/.test(value)) {
    try {
      const decoded = Buffer.from(value, 'latin1').toString('utf8');
      if (!decoded.includes('\uFFFD')) {
        return decoded;
      }
    } catch {
      // fallthrough
    }
  }

  return value;
}

@Injectable()
export class MtlsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & Record<typeof MTLS_KEY, object | null | undefined>>();
    request[MTLS_KEY] = null;

    const clientVerify = request.headers['x-ssl-client-verify'] as string;
    const clientDn = request.headers['x-ssl-client-dn'] as string;
    const clientCn = request.headers['x-ssl-client-cn'] as string;
    const clientSerial = request.headers['x-ssl-client-serial'] as string;
    const clientFingerprint = request.headers['x-ssl-client-fingerprint'] as string;
    const clientIssuer = request.headers['x-ssl-client-issuer'] as string;
    const clientCert = request.headers['x-ssl-client-cert'] as string;
    const clientCertEscaped = request.headers['x-ssl-client-cert-escaped'] as string;

    if (clientSerial) {
      if (clientVerify !== 'SUCCESS') {
        throw new ForbiddenException(Ei18nCodes.T3E0053);
      }

      if (!clientSerial && !clientFingerprint) {
        throw new ForbiddenException(Ei18nCodes.T3E0101);
      }

      const cert = clientCertEscaped || encodeURIComponent(clientCert || '');
      request[MTLS_KEY] = {
        verify: clientVerify,
        cn: decodeDnField(clientCn),
        dn: decodeDnField(clientDn),
        serial: clientSerial,
        fingerprint: clientFingerprint || clientSerial,
        issuer: decodeDnField(clientIssuer),
        cert,
      };
    }

    return true;
  }
}
