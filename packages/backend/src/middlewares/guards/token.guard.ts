import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BASIC_AUTH_KEY, NEGOTIATE_AUTH_KEY, ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { Ei18nCodes, UserRoles } from 'src/enums';
import {
  AUTH_CONTEXT_KEY,
  TAuthContextRequest,
  TokenKind,
  createAuthContext,
  resolveRequestPermissions,
} from 'src/request-auth';
import { AuthService } from 'src/modules/auth/auth.service';
import { SettingsService } from 'src/modules/settings/settings.service';
import { CLIENT_ID, NODE_ENV } from '../../constants';
import { convertToRoles } from '../../helpers';
import { OidcService } from '../../modules/oidc/oidc.service';
import { prisma } from '../../modules/prisma/prisma.client';
import { ORG_ID_KEY } from 'src/decorators/orgId.decorator';

/**
 * Guard for reading the token and getting the user
 * Checks Bearer and Basic Auth, extracts user_id, and resolves request permissions
 */
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly oidcService: OidcService,
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      TAuthContextRequest & {
        user_id?: string | null;
        role?: UserRoles;
      }
    >();
    const authorization = request.headers.authorization;
    let role: UserRoles = UserRoles.NONE;
    let tokenKind: TokenKind = 'session';

    request.tokenPermissions = [];
    request.rawTokenPermissions = [];
    request.tokenClientId = undefined;
    request[ROLE_KEY] = role;
    request[USER_ID_KEY] = null;
    request[ORG_ID_KEY] = null;
    request[AUTH_CONTEXT_KEY] = createAuthContext();
    let isBearerTokenAuth = false;

    // If there is no token in the request, define the role as NONE
    if (!authorization) {
      return true;
    }

    let client_id = CLIENT_ID;
    let user_id: string;

    // Get token information
    if (authorization.startsWith('Bearer ')) {
      const token = authorization.replace('Bearer ', '');

      if (!token || token.includes('undefined')) {
        return true;
      }

      // Check the validity of the token and get information about it
      const tokenInfo = await this.oidcService.tokenIntrospection(token);
      request.tokenClientId = tokenInfo.client_id;
      request.rawTokenPermissions = tokenInfo.tokenPermissions;
      tokenKind = tokenInfo.tokenKind;
      isBearerTokenAuth = true;

      client_id = tokenInfo.client_id;

      if (client_id && client_id !== CLIENT_ID) {
        throw new ForbiddenException(Ei18nCodes.T3E0068);
      }

      user_id = tokenInfo.user_id;

      // If the token is no longer active, throw an exception
      if (!tokenInfo.active) throw new UnauthorizedException(Ei18nCodes.T3E0068);
    } else if (authorization.startsWith('Basic ')) {
      const isBasicAllowed = this.reflector.get<boolean>(BASIC_AUTH_KEY, context.getHandler());

      if (NODE_ENV === 'production' && !isBasicAllowed) {
        throw new ForbiddenException(Ei18nCodes.T3E0077);
      }

      const credentials = authorization.replace('Basic ', '');

      if (!credentials) {
        return true;
      }

      // Get the ID and password from credentials
      const [identifier, password] = Buffer.from(credentials, 'base64').toString().split(':');
      if (!identifier || !password) {
        throw new BadRequestException(Ei18nCodes.T3E0060);
      }

      // Check the validity and get user information
      const user = await this.authService.checkUserCredentials(identifier, password);
      user_id = user.id.toString();
    } else if (authorization === 'Negotiate' || authorization.startsWith('Negotiate ')) {
      const isNegotiateAllowed = this.reflector.get<boolean>(
        NEGOTIATE_AUTH_KEY,
        context.getHandler(),
      );
      if (!isNegotiateAllowed) {
        throw new BadRequestException(Ei18nCodes.T3E0061);
      }
      return true;
    } else {
      throw new BadRequestException(Ei18nCodes.T3E0061);
    }

    // Save the user_id in the request context for further use
    request[USER_ID_KEY] = user_id;

    // Get the user's role in the main application
    const roleItem = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id,
          client_id: CLIENT_ID,
        },
      },
      include: {
        user: {
          select: {
            deleted: true,
            org_id: true,
          },
        },
      },
    });

    if (!roleItem) throw new BadRequestException(Ei18nCodes.T3E0059);

    role = convertToRoles(roleItem.role);

    const authorizeOnlyAdmins = await this.settingsService.isAuthorizeOnlyAdminsEnabled();
    if (authorizeOnlyAdmins && role !== UserRoles.EDITOR && role !== UserRoles.OWNER) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    switch (NODE_ENV) {
      case 'safe_mode': {
        if (role !== UserRoles.OWNER) {
          throw new ForbiddenException(
            'Safe mode is enabled. Only OWNER role can access the system.',
          );
        }
      }
      case 'production':
      case 'development':
        if (role === UserRoles.OWNER) {
          throw new ForbiddenException('Access with OWNER role is not allowed in this environment');
        }
        break;
      default:
        throw new ForbiddenException('Unknown NODE_ENV environment');
    }

    // Check if the user is blocked
    if (roleItem.blocked) throw new ForbiddenException(Ei18nCodes.T3E0024);
    if (roleItem.user.deleted) throw new ForbiddenException('DELETED');

    request[ORG_ID_KEY] = roleItem.user.org_id;
    const effectivePermissions = resolveRequestPermissions({
      role,
      rawTokenPermissions: request.rawTokenPermissions,
      tokenKind,
      isBearerTokenAuth,
    });
    request.tokenPermissions = effectivePermissions;
    request[AUTH_CONTEXT_KEY] = {
      userId: user_id,
      tokenKind,
      systemRole: role,
      effectiveRole: role,
      rawTokenPermissions: request.rawTokenPermissions,
      effectivePermissions,
      tokenClientId: request.tokenClientId,
    };

    // Save the role in request context
    request[ROLE_KEY] = role;

    return true;
  }
}
