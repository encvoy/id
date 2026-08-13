import {
  ListItems as SharedListItems,
  type ListItemsFilters,
  type ListItemsProps,
} from '@encvoy-id/components';
import { useTranslation } from 'react-i18next';

export type IListItemsFilters = ListItemsFilters;

type DashboardListItemsProps<T, L, P> = Omit<ListItemsProps<T, L, P>, 'labels'>;

/** Adds Dashboard translations to the shared list component. */
export const ListItems = <T, L, P>(props: DashboardListItemsProps<T, L, P>) => {
  const { t: translate } = useTranslation();

  return (
    <SharedListItems<T, L, P>
      {...props}
      labels={{
        empty: translate('info.emptySearch'),
        loading: translate('helperText.loading'),
        search: {
          placeholder: translate('helperText.search'),
          ariaLabel: translate('helperText.search'),
          history: {
            title: translate('search.recentSearches'),
            clearAll: translate('search.clearAll'),
          },
        },
      }}
    />
  );
};
