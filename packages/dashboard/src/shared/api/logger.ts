import { IQuerySortParams, IResponseListItems } from "./types";
import { createFetchArgs, parseResponse } from "./helpers";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { emptySplitApi } from "./baseApi";
import { endPoints } from "src/shared/utils/enums";

export interface ILogEvent {
  id: string;
  date: string;
  ip_address: string;
  device: string;
  user_id: string | null;
  client_id: string;
  event: string;
  description: string;
  details: string;
  name: string;
  avatar: string;
}

export const loggerApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getEventsLog: builder.query<
      IResponseListItems<ILogEvent[]>,
      IQuerySortParams
    >({
      query: (query) =>
        createFetchArgs<IQuerySortParams>(endPoints.logs, "GET", query),
      transformResponse: (logs: ILogEvent[], meta: FetchBaseQueryMeta) =>
        parseResponse<ILogEvent[]>(logs, meta),
    }),
  }),
});

export const { useLazyGetEventsLogQuery } = loggerApi;
