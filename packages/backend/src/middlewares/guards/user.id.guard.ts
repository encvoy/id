import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { ORG_ID_KEY } from 'src/decorators/orgId.decorator';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { AUTH_CONTEXT_KEY, TAuthContextRequest, resolveRequestPermissions } from 'src/request-auth';
import { CLIENT_ID } from '../../constants';
import { convertToRoles } from '../../helpers';
import { prisma } from '../../modules/prisma/prisma.client';

type TUserAccessRequest = TAuthContextRequest & {
  user_id?: string | null;
  role?: UserRoles;
  org_id?: string | null;
};

/**
 * Guard for checking user_id
 * Checks access to user_id from request parameters
 */
@Injectable()
export class UserIdGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TUserAccessRequest>();
    const isBearerTokenAuth = !!request.headers.authorization?.startsWith('Bearer ');

    // Get user_id and role from request context set by TokenGuard
    const user_id = request[USER_ID_KEY];
    let role = request[ROLE_KEY];
    const authContext = request[AUTH_CONTEXT_KEY];

    // If the user_id parameter is not specified in the request, skip the account access check
    if (!request.params.user_id) {
      return true;
    }

    // If the user is not authenticated, skip
    if (!user_id) {
      return true;
    }

    if (role === UserRoles.OWNER) {
      return true;
    }

    // If the user_id in the request matches the user_id in the token, skip the check
    // as the user has access to their own account
    if (request.params.user_id === user_id) {
      return true;
    }

    const tUserRole = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id: request.params.user_id,
          client_id: CLIENT_ID,
        },
      },
      include: {
        user: {
          select: {
            org_id: true,
          },
        },
      },
    });

    if (!tUserRole) {
      throw new BadRequestException(Ei18nCodes.T3E0059);
    }

    const tRole = convertToRoles(tUserRole.role);
    if (tRole === UserRoles.OWNER) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    if (request.params.client_id) {
      return true;
    }

    if (role === UserRoles.EDITOR) {
      return true;
    }

    const targetOrgId = tUserRole.user.org_id;
    if (!targetOrgId || targetOrgId === CLIENT_ID) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    const actorOrgRoleItem = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id,
          client_id: targetOrgId,
        },
      },
    });

    if (!actorOrgRoleItem) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    role = convertToRoles(actorOrgRoleItem.role);

    if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    request[ROLE_KEY] = role;
    request[ORG_ID_KEY] = targetOrgId;

    const effectivePermissions = resolveRequestPermissions({
      role,
      rawTokenPermissions: authContext?.rawTokenPermissions,
      tokenKind: authContext?.tokenKind,
      isBearerTokenAuth,
    });

    request.tokenPermissions = effectivePermissions;

    if (authContext) {
      authContext.clientRole = role;
      authContext.effectiveRole = role;
      authContext.effectivePermissions = effectivePermissions;
      authContext.targetClientId = targetOrgId;
    }

    return true;
  }
}
