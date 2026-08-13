import { endPoints } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";

export enum LogExportProvider {
  LOKI = "loki",
  HTTP = "http",
  GRAYLOG = "graylog",
  STDOUT = "stdout",
}

export interface IWinston {
  enabled?: boolean;
  export_enabled?: boolean;
  export_provider?: LogExportProvider;
  export_url?: string;
  export_api_key?: string;
  audit_export_enabled?: boolean;
  redact_headers?: string;
  service_name?: string;
  log_level?: string;
}

export const winstonApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getWinston: builder.query<IWinston, void>({
      query: () => endPoints.winston,
    }),
    updateWinston: builder.mutation<void, IWinston>({
      query: (data) => {
        return { url: endPoints.winston, method: "PUT", body: data };
      },
    }),
  }),
});

export const { useGetWinstonQuery, useUpdateWinstonMutation } = winstonApi;
