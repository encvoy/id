import type { OpenAPIObject } from '@nestjs/swagger';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const OAUTH2_SECURITY_NAME = 'oauth2';

type OpenApiOperation = {
  description?: string;
  security?: Array<Record<string, string[]>>;
};

const getRequiredScopes = (operation: OpenApiOperation): string[] => {
  const scopes = operation.security?.flatMap((security) => security[OAUTH2_SECURITY_NAME] || []) || [];
  return [...new Set(scopes.filter(Boolean))];
};

const appendRequiredScopeDescription = (operation: OpenApiOperation, requiredScopes: string[]) => {
  const scopeDescription = `**Required scope:** ${requiredScopes
    .map((scope) => `\`${scope}\``)
    .join(', ')}`;
  const description = typeof operation.description === 'string' ? operation.description.trim() : '';

  operation.description = description
    ? `${description}\n\n${scopeDescription}`
    : scopeDescription;
};

export const annotateRequiredScopes = (document: OpenAPIObject) => {
  for (const pathItem of Object.values(document.paths || {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method] as OpenApiOperation | undefined;
      if (!operation) continue;

      const requiredScopes = getRequiredScopes(operation);
      if (!requiredScopes.length) continue;

      appendRequiredScopeDescription(operation, requiredScopes);
    }
  }
};
