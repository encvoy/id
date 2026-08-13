export interface IQueryIdProps {
  id: string;
  client_id: string;
}

export interface IQuerySortParams {
  limit: number;
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

export interface IQueryId {
  id: string;
}

export interface IResponseListItems<T> {
  items: T;
  totalCount: number;
  perPage: number;
  currentOffset: number;
  nextOffset: number;
}

export type TFileString = File | null | string | undefined;
