import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { ORG_ID_KEY } from 'src/decorators/orgId.decorator';
import { CLIENT_ID } from 'src/constants';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { convertToRoles } from 'src/helpers';
import { AUTH_CONTEXT_KEY, TAuthContextRequest, resolveRequestPermissions } from 'src/request-auth';
import { prisma } from '../../modules/prisma/prisma.client';

type TOrgIdRequest = TAuthContextRequest & {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  method?: string;
  originalUrl?: string;
  path?: string;
};

@Injectable()
export class OrgIdGuard implements CanActivate {
  private getStringValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
  }

  private isCreateClientRequest(request: TOrgIdRequest): boolean {
    const path = request.originalUrl || request.path || '';
    const pathname = path.split('?')[0];

    return request.method === 'POST' && /\/v1\/clients\/?$/.test(pathname);
  }

  private resolveOrganizationIdFromRequest(request: TOrgIdRequest): string | undefined {
    const explicitOrganizationId =
      this.getStringValue(request.params?.org_id) ||
      this.getStringValue(request.params?.organization_id) ||
      this.getStringValue(request.query?.org_id) ||
      this.getStringValue(request.query?.organization_id) ||
      this.getStringValue(request.body?.org_id) ||
      this.getStringValue(request.body?.organization_id);

    if (explicitOrganizationId) {
      return explicitOrganizationId;
    }

    if (this.isCreateClientRequest(request)) {
      return this.getStringValue(request.body?.parent_id);
    }

    return undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TOrgIdRequest>();
    const isBearerTokenAuth = !!request.headers.authorization?.startsWith('Bearer ');
    const userId = request[USER_ID_KEY];
    const systemRole = request[ROLE_KEY];
    const authContext = request[AUTH_CONTEXT_KEY];
    const organizationId = this.resolveOrganizationIdFromRequest(request);

    if (!organizationId || !userId) {
      return true;
    }

    const organization = await prisma.client.findFirst({
      where: {
        client_id: organizationId,
        OR: [{ client_id: CLIENT_ID }, { parent_id: null }],
      },
      select: { client_id: true },
    });

    if (!organization) {
      throw new ForbiddenException(Ei18nCodes.T3E0071);
    }

    request[ORG_ID_KEY] = organizationId;

    if (systemRole === UserRoles.OWNER || systemRole === UserRoles.EDITOR) {
      if (authContext) {
        authContext.targetClientId = organizationId;
      }
      return true;
    }

    const [organizationRole, user] = await Promise.all([
      prisma.role.findUnique({
        where: {
          user_id_client_id: {
            user_id: userId,
            client_id: organizationId,
          },
        },
        select: {
          role: true,
          blocked: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { org_id: true },
      }),
    ]);

    if (organizationRole?.blocked) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    if (!organizationRole && organizationId !== CLIENT_ID && user?.org_id !== organizationId) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    if (!organizationRole) {
      if (authContext) {
        authContext.targetClientId = organizationId;
      }
      return true;
    }

    const role = convertToRoles(organizationRole.role);
    const effectivePermissions = resolveRequestPermissions({
      role,
      rawTokenPermissions: authContext?.rawTokenPermissions,
      tokenKind: authContext?.tokenKind,
      isBearerTokenAuth,
    });

    request[ROLE_KEY] = role;
    request.tokenPermissions = effectivePermissions;

    if (authContext) {
      authContext.clientRole = role;
      authContext.effectiveRole = role;
      authContext.effectivePermissions = effectivePermissions;
      authContext.targetClientId = organizationId;
    }

    return true;
  }
}
