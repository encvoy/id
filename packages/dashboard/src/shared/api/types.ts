export interface IQueryIdProps {
  userId: string;
  clientId: string;
}

export interface IQuerySortParams {
  limit: string;
  offset: number;
  sortDirection?: string;
  sortBy?: string;
  search?: string;
  filter?: string;
}

export interface IQueryPropsWithId {
  query: IQuerySortParams;
  id: string;
}

export type TQueryId = {
  id: string;
};

export type responseListItems<T> = {
  items: T;
  totalCount: number;
  perPage: number;
  currentOffset: number;
  nextOffset: number;
};

export type TFileString = File | null | string | undefined;
