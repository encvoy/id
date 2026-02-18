import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DOMAIN } from "../utils/constants";

export const ethereumApi = createApi({
  reducerPath: "ethereumApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${DOMAIN}/api/eth/v1`,
  }),

  endpoints: (builder) => ({
    getNonce: builder.query<{ nonce: string }, string>({
      query: (address) => `/nonce/` + address,
    }),
  }),
});

export const { useLazyGetNonceQuery } = ethereumApi;
