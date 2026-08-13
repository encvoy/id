import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Actions, Ei18nCodes } from '../../enums';
import { prisma } from '../prisma/prisma.client';
import * as dto from './statistics.dto';

type TDashboardStatisticsRow = {
  day: string;
  authCount: number;
  uniqueUsersCount: number;
};

type TDashboardStatisticsAuthMethodRow = {
  type: string;
  authCount: number;
};

function formatUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

@Injectable()
export class StatisticsService {
  async getClientDashboardStatistics(
    client_id: string,
    days: number,
  ): Promise<dto.ClientDashboardStatisticsDto> {
    const client = await prisma.client.findUnique({
      where: { client_id },
      select: { client_id: true },
    });

    if (!client) {
      throw new BadRequestException(Ei18nCodes.T3E0071);
    }

    const normalizedDays = days || 30;
    const todayUtc = startOfUtcDay();
    const startDate = addUtcDays(todayUtc, -(normalizedDays - 1));
    const endDate = addUtcDays(todayUtc, 1);

    const rows = await prisma.$queryRaw<TDashboardStatisticsRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "date" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS "authCount",
        COUNT(DISTINCT "user_id")::int AS "uniqueUsersCount"
      FROM "Log"
      WHERE "client_id" = ${client_id}
        AND "event" = ${Actions.USER_LOGIN_SUCCESS}
        AND "date" >= ${startDate}
        AND "date" < ${endDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    const authMethodsRows = await prisma.$queryRaw<TDashboardStatisticsAuthMethodRow[]>(Prisma.sql`
      WITH "preparedLogs" AS (
        SELECT
          CASE
            WHEN jsonb_typeof("details") = 'object' THEN "details"->>'type'
            WHEN jsonb_typeof("details") = 'string'
              AND COALESCE("details" #>> '{}', '') LIKE '{%'
            THEN (("details" #>> '{}')::jsonb)->>'type'
            ELSE NULL
          END AS "rawType"
        FROM "Log"
        WHERE "client_id" = ${client_id}
          AND "event" = ${Actions.USER_LOGIN_SUCCESS}
          AND "date" >= ${startDate}
          AND "date" < ${endDate}
      ),
      "filteredLogs" AS (
        SELECT
          COALESCE(NULLIF("rawType", ''), 'UNKNOWN') AS "type"
        FROM "preparedLogs"
      )
      SELECT
        "type",
        COUNT(*)::int AS "authCount"
      FROM "filteredLogs"
      GROUP BY "type"
      ORDER BY "authCount" DESC, "type" ASC
    `);

    const pointsByDate = new Map<string, dto.ClientDashboardStatisticsPointDto>(
      rows.map((row) => {
        const date = row.day;

        return [
          date,
          {
            date,
            authCount: Number(row.authCount),
            uniqueUsersCount: Number(row.uniqueUsersCount),
          },
        ];
      }),
    );

    const points = Array.from({ length: normalizedDays }, (_, index) => {
      const currentDate = addUtcDays(startDate, index);
      const date = formatUtcDateKey(currentDate);

      return (
        pointsByDate.get(date) || {
          date,
          authCount: 0,
          uniqueUsersCount: 0,
        }
      );
    });

    return {
      days: normalizedDays,
      points,
      authMethods: authMethodsRows.map((row) => ({
        type: row.type,
        authCount: Number(row.authCount),
      })),
    };
  }
}
