import { endPoints } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";
import { createFetchArgs } from "./helpers";

export interface IClientDashboardStatisticsPoint {
  date: string;
  authCount: number;
  uniqueUsersCount: number;
}

export interface IClientDashboardStatisticsAuthMethod {
  type: string;
  authCount: number;
}

export interface IClientDashboardStatistics {
  days: number;
  points: IClientDashboardStatisticsPoint[];
  authMethods: IClientDashboardStatisticsAuthMethod[];
}

export interface IClientDashboardStatisticsQuery {
  clientId: string;
  days?: number;
}

export const statisticsApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    getClientDashboardStatistics: builder.query<
      IClientDashboardStatistics,
      IClientDashboardStatisticsQuery
    >({
      query: ({ clientId, days = 30 }) =>
        createFetchArgs(
          `${endPoints.statistics}/clients/${clientId}/dashboard`,
          "GET",
          {
            days,
          }
        ),
    }),
  }),
});

export const { useGetClientDashboardStatisticsQuery } = statisticsApi;
