type RuntimeEnv = Record<string, string | undefined>;

const ENV_REFERENCE_PATTERN = /\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/;
const URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//;

const stripOptionalQuotes = (value: string) => value.replace(/^(['"])(.*)\1$/, '$2');

export const resolveRuntimeDomain = (env: RuntimeEnv = process.env): string => {
  const idHost = stripOptionalQuotes(env.ID_HOST?.trim() ?? '');
  const configuredDomain = stripOptionalQuotes((env.DOMAIN || env.VITE_DOMAIN || '').trim());
  const configuredBasePath = stripOptionalQuotes(env.ID_BASE_PATH?.trim() ?? '');
  const basePath =
    configuredBasePath && configuredBasePath !== '/'
      ? `/${configuredBasePath.replace(/^\/+|\/+$/g, '')}`
      : '';
  let domain = configuredDomain || `${idHost.replace(/\/+$/, '')}${basePath}`;

  if (idHost) {
    domain = domain
      .replace(/\$\{ID_HOST(?::-[^}]*)?\}/g, idHost)
      .replace(/\$ID_HOST\b/g, idHost);
  }

  domain = domain.replace(/\/+$/, '');

  if (domain && !URL_SCHEME_PATTERN.test(domain)) {
    domain = `https://${domain}`;
  }

  return domain;
};

export const requireRuntimeDomain = (domain = resolveRuntimeDomain()): string => {
  if (!domain) {
    throw new Error('[CONFIG] ID_HOST is required. Set ID_HOST=example.com.');
  }

  if (ENV_REFERENCE_PATTERN.test(domain)) {
    throw new Error(
      `[CONFIG] Runtime domain contains an unresolved environment reference: ${domain}. Set ID_HOST=example.com.`,
    );
  }

  try {
    const parsedDomain = new URL(domain);
    if (!['http:', 'https:'].includes(parsedDomain.protocol) || !parsedDomain.hostname) {
      throw new Error('DOMAIN must include http(s) protocol and hostname');
    }
  } catch (error) {
    throw new Error(`[CONFIG] Runtime domain must resolve to an absolute http(s) URL, got: ${domain}`);
  }

  return domain;
};
