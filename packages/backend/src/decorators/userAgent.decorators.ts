import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parses user-agent string into a human-readable label (browser and OS name only)
 */
export function parseUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown device';

  // Getting the browser name without the version
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)/);
  const osMatch = userAgent.match(/\(([^)]+)\)/);

  const browser = browserMatch ? browserMatch[1] : 'Unknown browser';
  const os = osMatch ? osMatch[1].replace(/_/g, '.') : 'Unknown OS';

  return `${browser} (${os})`;
}

/**
 * Decorator to get user-agent from request headers
 */
export const UserAgent = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return parseUserAgent(request.headers['user-agent'] || '');
});
