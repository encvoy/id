import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { endPoints, ETags } from "src/shared/utils/enums";
import {
  createFetchArgs,
  createFetchArgsWithBody,
  parseResponse,
} from "./helpers";
import { IQuerySortParams, IResponseListItems } from "./types";
import { emptySplitApi } from "./baseApi";

export interface IPersonalToken {
  id: string;
  name: string;
  permissions: string[];
  last4: string;
  created_at: string;
  expires_at: string | null;
  token_kind: "personal_access";
  client_id: string;
  user_id: string;
}

export interface IAvailableTokenPermissions {
  permissions: string[];
}

export interface ICreatePersonalTokenPayload {
  name: string;
  permissions: string[];
  expires_in?: number;
  expires_at?: string;
  never_expires?: boolean;
}

export interface ICreatePersonalTokenResponse {
  id: string;
  name: string;
  access_token: string;
  token_type: string;
  expires_in: number | null;
  expires_at: string | null;
  permissions: string[];
  last4: string;
}

export const tokensApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getPersonalTokens: builder.query<
      IResponseListItems<IPersonalToken[]>,
      IQuerySortParams
    >({
      query: (query) =>
        createFetchArgs<IQuerySortParams>(endPoints.tokens, "GET", query),
      transformResponse: (tokens: IPersonalToken[], meta: FetchBaseQueryMeta) =>
        parseResponse<IPersonalToken[]>(tokens, meta),
      providesTags: [ETags.Tokens],
    }),
    getAvailableTokenPermissions: builder.query<
      IAvailableTokenPermissions,
      void
    >({
      query: () => `${endPoints.tokens}/available-permissions`,
    }),
    createPersonalToken: builder.mutation<
      ICreatePersonalTokenResponse,
      ICreatePersonalTokenPayload
    >({
      query: (body) => createFetchArgsWithBody(endPoints.tokens, "POST", body),
      invalidatesTags: [ETags.Tokens],
    }),
    revokePersonalToken: builder.mutation<void, { id: string }>({
      query: ({ id }) => createFetchArgs(`${endPoints.tokens}/${id}`, "DELETE"),
      invalidatesTags: [ETags.Tokens],
    }),
  }),
});

export const {
  useLazyGetPersonalTokensQuery,
  useGetAvailableTokenPermissionsQuery,
  useCreatePersonalTokenMutation,
  useRevokePersonalTokenMutation,
} = tokensApi;
