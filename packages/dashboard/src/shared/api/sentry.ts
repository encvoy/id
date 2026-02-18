import { endPoints } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";

export interface ISentry {
  dsn: string | null;
  user_id: string | null;
  enabled: boolean;
}

export const sentryApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getSentry: builder.query<ISentry, void>({
      query: () => endPoints.sentry,
    }),
    updateSentry: builder.mutation<void, ISentry>({
      query: (data) => {
        return { url: endPoints.sentry, method: "PUT", body: data };
      },
    }),
  }),
});

export const { useGetSentryQuery, useUpdateSentryMutation } = sentryApi;
