import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {APP_PUBLIC_URL} from "src/shared/utils/appBasePath";

export const ethereumApi = createApi({
  reducerPath: "ethereumApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_PUBLIC_URL}/api/eth/v1`,
  }),

  endpoints: (builder) => ({
    getNonce: builder.query<{ nonce: string }, string>({
      query: (address) => `/nonce/` + address,
    }),
  }),
});

export const { useLazyGetNonceQuery } = ethereumApi;
