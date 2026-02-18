import { createFetchArgs } from "./helpers";
import { emptySplitApi } from "./baseApi";

export const authApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getOauth: builder.mutation<
      { url: string },
      {
        provider_id: string;
        state: string;
        return_url?: boolean;
      }
    >({
      query: (query) => createFetchArgs("auth/oauth", "GET", query),
    }),
  }),
});

export const { useGetOauthMutation } = authApi;
