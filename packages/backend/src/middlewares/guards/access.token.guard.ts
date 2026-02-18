import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { BASIC_AUTH_KEY, ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { app } from 'src/main';
import { AuthService } from 'src/modules/auth/auth.service';
import { ESettingsNames } from 'src/modules/settings/settings.dto';
import { CLIENT_ID, NODE_ENV } from '../../constants';
import { convertToRoles } from '../../helpers';
import { OidcService } from '../../modules/oidc/oidc.service';
import { prisma } from '../../modules/prisma/prisma.client';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class AccessGuard implements CanActivate {
  private _oidcService: OidcService;
  private _settingsService: SettingsService;
  private _authService: AuthService;

  get oidcService(): OidcService {
    if (!this._oidcService) {
      this._oidcService = app.get(OidcService);
    }

    return this._oidcService;
  }

  get settingsService(): SettingsService {
    if (!this._settingsService) {
      this._settingsService = app.get(SettingsService);
    }

    return this._settingsService;
  }

  get authService(): AuthService {
    if (!this._authService) {
      this._authService = app.get(AuthService);
    }

    return this._authService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    let role: UserRoles = UserRoles.NONE;
    Reflect.defineMetadata(ROLE_KEY, role, context.getHandler());
    Reflect.defineMetadata(USER_ID_KEY, null, context.getHandler());

    // If there is no token in the request, define the role as NONE
    if (!request.headers.authorization) {
      return true;
    }

    let client_id = CLIENT_ID;
    let user_id: string;

    // Get token information
    if (request.headers.authorization.includes('Bearer')) {
      const token = request.headers.authorization.replace('Bearer ', '');

      if (!token || token.includes('undefined')) {
        return true;
      }

      // Check the token's validity and retrieve information about it
      const tokenInfo = await this.oidcService.tokenIntrospection(token);

      client_id = tokenInfo.client_id;

      if (client_id && client_id !== CLIENT_ID) {
        throw new ForbiddenException(Ei18nCodes.T3E0068);
      }

      user_id = tokenInfo.user_id;

      // If the token is no longer active, throw an exception
      if (!tokenInfo.active) throw new UnauthorizedException(Ei18nCodes.T3E0068);
    } else if (request.headers.authorization.includes('Basic')) {
      const isBasicAllowed = Reflect.getMetadata(BASIC_AUTH_KEY, context.getHandler());

      if (NODE_ENV === 'production' && !isBasicAllowed) {
        throw new ForbiddenException(Ei18nCodes.T3E0077);
      }

      const credentials = request.headers.authorization?.replace('Basic ', '');

      if (!credentials) {
        return true;
      }

      // Get the ID and password from credentials
      const [identifier, password] = Buffer.from(credentials, 'base64').toString().split(':');
      if (!identifier || !password) {
        throw new BadRequestException(Ei18nCodes.T3E0060);
      }

      // Check the validity and retrieve user information
      const user = await this.authService.checkUserCredentials(identifier, password);
      user_id = user.id.toString();
    } else {
      throw new BadRequestException(Ei18nCodes.T3E0061);
    }

    // Save the user_id in the request context for later use
    Reflect.defineMetadata(USER_ID_KEY, user_id, context.getHandler());

    // Get the user's role in the main application
    const roleItem = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id: parseInt(user_id, 10),
          client_id: CLIENT_ID,
        },
      },
      include: {
        user: {
          select: {
            blocked: true,
            deleted: true,
            email: true,
          },
        },
      },
    });
    if (!roleItem) throw new BadRequestException(Ei18nCodes.T3E0059);

    role = convertToRoles(roleItem.role);

    // If the user_id parameter is specified in the request, get the user's role in the application
    let tRole: UserRoles = UserRoles.NONE;
    if (request.params.user_id) {
      // Check the user's role in the application
      const tUserRole = await prisma.role.findUnique({
        where: {
          user_id_client_id: {
            user_id: parseInt(request.params.user_id, 10),
            client_id: CLIENT_ID,
          },
        },
      });
      if (!tUserRole) throw new BadRequestException(Ei18nCodes.T3E0059);

      tRole = convertToRoles(tUserRole.role);
    }

    // The Personal Account owner has exclusive rights
    if (role === UserRoles.OWNER) {
      Reflect.defineMetadata(ROLE_KEY, role, context.getHandler());
      return true;
    }

    // Check if the user is blocked
    if (roleItem.user.blocked) throw new ForbiddenException(Ei18nCodes.T3E0024);
    if (roleItem.user.deleted) throw new ForbiddenException('DELETED');

    // The Editor has similar rights to the Owner
    if (role === UserRoles.EDITOR) {
      Reflect.defineMetadata(ROLE_KEY, role, context.getHandler());
      return true;
    }

    // Check if authorization is prohibited for users
    const authorize_only_admins = await this.settingsService.getSettingsByName<boolean>(
      ESettingsNames.authorize_only_admins,
    );

    // If the setting is enabled, only administrators of the main application can access
    if (authorize_only_admins) throw new ForbiddenException(Ei18nCodes.T3E0026);

    const clientId = request.params.client_id // If the request contains the client_id parameter, override the role by application
      ? request.params.client_id
      : client_id !== CLIENT_ID // If the request is within the application, not the Personal Account, override the role by application from the token
      ? client_id
      : undefined;

    if (clientId) {
      const roleItemClient = await prisma.role.findUnique({
        where: {
          user_id_client_id: {
            user_id: parseInt(user_id, 10),
            client_id: clientId,
          },
        },
      });
      if (!roleItemClient) throw new ForbiddenException(Ei18nCodes.T3E0026);

      role = convertToRoles(roleItemClient.role);

      const client = await prisma.client.findUnique({
        where: {
          client_id: clientId,
        },
      });
      if (!client) {
        throw new ForbiddenException(Ei18nCodes.T3E0071);
      }

      if (client.authorize_only_admins) {
        if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
          throw new ForbiddenException(Ei18nCodes.T3E0026);
        }
      }

      if (client.authorize_only_employees) {
        const isHaveRole = await prisma.role.findFirst({
          where: {
            client_id: client.client_id,
            user_id: parseInt(user_id),
          },
        });

        if (!isHaveRole) throw new ForbiddenException(Ei18nCodes.T3E0026);
      }
    }

    Reflect.defineMetadata(ROLE_KEY, role, context.getHandler());

    // If the user_id parameter is not included in the request, skip the account access check
    if (!request.params.user_id) {
      return true;
    }

    // If the user's id is in If the request matches the user ID in the token, we skip the check, since the user has access to their own account.
    if (request.params.user_id === user_id) {
      return true;
    }

    // No one can edit the "Owner" account of the main application.
    if (tRole === UserRoles.OWNER) throw new ForbiddenException(Ei18nCodes.T3E0026);

    // If this is the administrator of the main application, then they have access to any account.
    if (!clientId) {
      return role === UserRoles.EDITOR;
    }

    // We check if the requested user exists in the application.
    const tUserRoleItem = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id: parseInt(request.params.user_id, 10),
          client_id: clientId,
        },
      },
    });
    if (!tUserRoleItem) throw new ForbiddenException(Ei18nCodes.T3E0003);

    // If it is not the application administrators who are making the request, then access is denied.
    if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    return true;
  }
}
