import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ROLES } from '../../roles';
import { UserRoles } from '../../enums';
import { ROLE_KEY, SCOPE_KEY } from '../../decorators';

/**
 * ScopeGuard - protection for routes that require checking for specific scopes
 * If no scopes are specified on the controller, access is allowed
 * Applies to all controllers
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const reflector = new Reflector();

    const requiredScope = reflector.get<string>(SCOPE_KEY, context.getHandler());
    if (!requiredScope) return true;

    const role = reflector.get<UserRoles>(ROLE_KEY, context.getHandler());
    if (!role) return false;

    return ROLES.get(role).some((r) => r === requiredScope);
  }
}
