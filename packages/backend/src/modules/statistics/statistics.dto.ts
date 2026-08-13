import * as swagger from '@nestjs/swagger';
import * as cv from 'class-validator';
import { TransformToNumber } from 'src/decorators';

export class ClientDashboardStatisticsQueryDto {
  @TransformToNumber()
  @cv.IsInt()
  @cv.Min(1)
  @cv.Max(365)
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({
    example: 30,
    default: 30,
    description: 'Statistics period in days',
  })
  days?: number = 30;
}

export class ClientDashboardStatisticsPointDto {
  @swagger.ApiProperty({ example: '2026-03-19' })
  date: string;

  @swagger.ApiProperty({ example: 18 })
  authCount: number;

  @swagger.ApiProperty({ example: 11 })
  uniqueUsersCount: number;
}

export class ClientDashboardStatisticsAuthMethodDto {
  @swagger.ApiProperty({ example: 'CREDENTIALS' })
  type: string;

  @swagger.ApiProperty({ example: 18 })
  authCount: number;
}

export class ClientDashboardStatisticsDto {
  @swagger.ApiProperty({ example: 30 })
  days: number;

  @swagger.ApiProperty({ type: [ClientDashboardStatisticsPointDto] })
  points: ClientDashboardStatisticsPointDto[];

  @swagger.ApiProperty({ type: [ClientDashboardStatisticsAuthMethodDto] })
  authMethods: ClientDashboardStatisticsAuthMethodDto[];
}
