import { Prisma } from '@prisma/client';
import { I18nContext } from 'nestjs-i18n';
import { ELocales, SortDirection } from 'src/enums';
import { getDefaultLocale, resolveLocalizedText } from 'src/utils/localized-text';

export const CLIENT_NAME_LOCALE_PATHS = Array.from(
  new Set([...Object.values(ELocales), ...Object.values(ELocales).map((locale) => locale.split('-')[0])]),
);

export const buildClientNameSearchConditions = (search: string): Prisma.ClientWhereInput[] => {
  return buildLocalizedClientFieldSearchConditions('name', search);
};

export const buildLocalizedClientFieldSearchConditions = (
  field: 'name' | 'catalog_name',
  search: string,
): Prisma.ClientWhereInput[] => {
  const searchValue = search.trim();
  if (!searchValue) {
    return [];
  }

  return CLIENT_NAME_LOCALE_PATHS.map(
    (locale) =>
      ({
        [field]: {
          path: [locale],
          string_contains: searchValue,
        },
      }) as Prisma.ClientWhereInput,
  );
};

export const getClientCatalogDisplayName = <T extends { catalog_name?: unknown; name?: unknown }>(
  item: T,
) => item.catalog_name ?? item.name;

export type TLocalizedClientSortContext = {
  requestLocale: string;
  defaultLocale: string;
};

export const getLocalizedClientSortContext = async (): Promise<TLocalizedClientSortContext> => {
  const defaultLocale = await getDefaultLocale();

  return {
    requestLocale: I18nContext.current()?.lang || defaultLocale,
    defaultLocale,
  };
};

export const compareLocalizedClientNames = (
  leftName: unknown,
  rightName: unknown,
  leftClientId: string,
  rightClientId: string,
  sortDirection: SortDirection,
  sortContext: TLocalizedClientSortContext,
) => {
  const leftValue = resolveLocalizedText(
    leftName,
    sortContext.requestLocale,
    sortContext.defaultLocale,
  );
  const rightValue = resolveLocalizedText(
    rightName,
    sortContext.requestLocale,
    sortContext.defaultLocale,
  );
  const result = leftValue.localeCompare(rightValue, sortContext.requestLocale, {
    sensitivity: 'base',
  });

  if (result !== 0) {
    return sortDirection === SortDirection.DESC ? -result : result;
  }

  return leftClientId.localeCompare(rightClientId, undefined, {
    sensitivity: 'base',
  });
};

export const sortItemsByLocalizedClientName = <T>(
  items: T[],
  options: {
    sortDirection: SortDirection;
    sortContext: TLocalizedClientSortContext;
    getClientName: (item: T) => unknown;
    getClientId: (item: T) => string;
  },
) => {
  const { getClientId, getClientName, sortContext, sortDirection } = options;

  return [...items].sort((left, right) =>
    compareLocalizedClientNames(
      getClientName(left),
      getClientName(right),
      getClientId(left),
      getClientId(right),
      sortDirection,
      sortContext,
    ),
  );
};
