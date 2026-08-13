import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SCOPE_KEY } from '../../decorators';
import { AUTH_CONTEXT_KEY, TAuthContextRequest } from 'src/request-auth';

/**
 * ScopeGuard - protection for routes that require checking for specific scopes.
 * TokenGuard and ClientIdGuard prepare the final permission list for authenticated requests.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const reflector = new Reflector();
    const request = context.switchToHttp().getRequest<TAuthContextRequest>();

    const requiredScope = reflector.get<string>(SCOPE_KEY, context.getHandler());
    if (!requiredScope) return true;

    const effectivePermissions =
      request[AUTH_CONTEXT_KEY]?.effectivePermissions || request.tokenPermissions;

    if (!effectivePermissions || !Array.isArray(effectivePermissions)) return false;

    return effectivePermissions.includes(requiredScope);
  }
}
