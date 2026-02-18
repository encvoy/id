import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { IQuerySortParams, responseListItems } from "./types";
import { createFetchArgs, parseResponse } from "./helpers";
import { ICatalogClient } from "./clients";
import { emptySplitApi } from "./baseApi";
import { endPoints, ETags } from "src/shared/utils/enums";

export const catalogApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getCatalog: builder.query<
      responseListItems<ICatalogClient[]>,
      IQuerySortParams
    >({
      query: (query) =>
        createFetchArgs<IQuerySortParams>(endPoints.catalog, "GET", query),
      transformResponse: (items: ICatalogClient[], meta: FetchBaseQueryMeta) =>
        parseResponse<ICatalogClient[]>(items, meta),
      providesTags: [ETags.Catalog],
    }),
  }),
});

export const { useGetCatalogQuery } = catalogApi;
