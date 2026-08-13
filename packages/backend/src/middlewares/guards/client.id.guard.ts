import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { AUTH_CONTEXT_KEY, TAuthContextRequest, resolveRequestPermissions } from 'src/request-auth';
import { getClientAuthorizationContext } from 'src/modules/auth/client-authorization';
import { CLIENT_ID } from '../../constants';
import { convertToRoles } from '../../helpers';
import { prisma } from '../../modules/prisma/prisma.client';

/**
 * Guard for checking client_id
 * Checks access to the client, gets the role in the client, and checks client settings
 */
@Injectable()
export class ClientIdGuard implements CanActivate {
  private getStringValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
  }

  private async resolveClientIdFromRequest(
    request: TAuthContextRequest & {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    },
  ) {
    const paramsClientId = this.getStringValue(request.params?.client_id);
    if (paramsClientId) {
      return paramsClientId;
    }

    const explicitClientId =
      this.getStringValue(request.query?.client_id) || this.getStringValue(request.body?.client_id);

    if (explicitClientId) {
      return explicitClientId;
    }

    const groupId = this.getStringValue(request.params?.group_id);
    if (groupId) {
      const group = await prisma.rbacGroup.findUnique({
        where: { id: groupId },
        select: { client_id: true },
      });

      return group?.client_id;
    }

    const resourceId =
      this.getStringValue(request.params?.resource_id) ||
      this.getStringValue(request.body?.resource_id);
    if (resourceId) {
      const resource = await prisma.rbacResource.findUnique({
        where: { id: resourceId },
        select: { client_id: true },
      });

      return resource?.client_id;
    }

    const roleId =
      this.getStringValue(request.params?.role_id) || this.getStringValue(request.body?.role_id);
    if (roleId) {
      const role = await prisma.rbacRole.findUnique({
        where: { id: roleId },
        select: { client_id: true },
      });

      return role?.client_id;
    }

    const assignmentId = this.getStringValue(request.params?.assignment_id);
    if (assignmentId) {
      const assignment = await prisma.rbacAssignment.findUnique({
        where: { id: assignmentId },
        select: {
          resource: {
            select: {
              client_id: true,
            },
          },
        },
      });

      return assignment?.resource.client_id;
    }

    return undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      TAuthContextRequest & {
        user_id?: string | null;
        role?: UserRoles;
      }
    >();
    const isBearerTokenAuth = !!request.headers.authorization?.startsWith('Bearer ');

    // Get user_id and current role from request context
    const user_id = request[USER_ID_KEY];
    let role = request[ROLE_KEY];
    const authContext = request[AUTH_CONTEXT_KEY];

    const clientId = await this.resolveClientIdFromRequest(request);

    if (!clientId || !user_id) {
      return true;
    }

    const client = await prisma.client.findUnique({
      where: {
        client_id: clientId,
      },
      select: {
        client_id: true,
        parent_id: true,
        authorize_only_admins: true,
        authorize_only_employees: true,
      },
    });

    if (!client) {
      throw new ForbiddenException(Ei18nCodes.T3E0071);
    }

    const authorizationContext = await getClientAuthorizationContext(user_id, client);

    if (authorizationContext.isClientAccessBlocked) {
      throw new ForbiddenException(Ei18nCodes.T3E0024);
    }

    if (role === UserRoles.OWNER || role === UserRoles.EDITOR) {
      if (authContext) {
        authContext.targetClientId = clientId;
        authContext.effectiveRole = role;
        authContext.effectivePermissions = resolveRequestPermissions({
          role,
          rawTokenPermissions: authContext.rawTokenPermissions,
          tokenKind: authContext.tokenKind,
          isBearerTokenAuth,
        });
        request.tokenPermissions = authContext.effectivePermissions;
      }
      return true;
    }

    const isChildClient = client.client_id !== CLIENT_ID && client.parent_id !== null;

    // Get role of the user in the application or inherit admin access from the parent organization.
    let roleItemClient = authorizationContext.clientRole;
    if (!roleItemClient && isChildClient && authorizationContext.organizationRole) {
      const organizationRole = convertToRoles(authorizationContext.organizationRole.role);

      if (organizationRole === UserRoles.EDITOR || organizationRole === UserRoles.OWNER) {
        roleItemClient = authorizationContext.organizationRole;
      }
    }

    if (!roleItemClient) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    role = convertToRoles(roleItemClient.role);

    // Check authorize_only_admins for the client
    if (client.authorize_only_admins) {
      if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
        throw new ForbiddenException(Ei18nCodes.T3E0026);
      }
    }

    // Check authorize_only_employees for the client
    if (client.authorize_only_employees) {
      const isHaveRole = await prisma.role.findFirst({
        where: {
          client_id: client.client_id,
          user_id,
        },
      });

      if (!isHaveRole) {
        throw new ForbiddenException(Ei18nCodes.T3E0026);
      }
    }

    if (request.params.user_id) {
      const isOrganizationRootClient = client.client_id !== CLIENT_ID && client.parent_id === null;

      if (isOrganizationRootClient) {
        const targetUser = await prisma.user.findUnique({
          where: { id: request.params.user_id },
          select: { org_id: true },
        });

        if (!targetUser || targetUser.org_id !== clientId) {
          throw new ForbiddenException(Ei18nCodes.T3E0003);
        }

        if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
          throw new ForbiddenException(Ei18nCodes.T3E0026);
        }
      } else {
        // We check if the requested user exists in the application.
        const tUserRoleItem = await prisma.role.findUnique({
          where: {
            user_id_client_id: {
              user_id: request.params.user_id,
              client_id: clientId,
            },
          },
        });
        if (!tUserRoleItem) throw new ForbiddenException(Ei18nCodes.T3E0003);

        // If it is not the application administrators who are making the request, then access is denied.
        if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
          throw new ForbiddenException(Ei18nCodes.T3E0026);
        }
      }
    }

    // Update role in request context
    request[ROLE_KEY] = role;
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
      authContext.targetClientId = clientId;
    }

    return true;
  }
}
