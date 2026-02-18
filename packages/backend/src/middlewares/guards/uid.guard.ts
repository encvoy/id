import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class UidNotUndefinedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const uid = request.params.uid;

    // Skip validation for Next.js RSC (React Server Component) requests
    const isNextRSC = request.headers['rsc'] || request.headers['next-router-state-tree'];
    if (isNextRSC && uid === 'undefined') {
      return false;
    }

    // Check only if uid param exists in the route
    if (uid !== undefined && (uid === 'undefined' || uid === null || uid === '')) {
      throw new BadRequestException('Invalid uid');
    }
    return true;
  }
}
