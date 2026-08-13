import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as cv from 'class-validator';
import { TransformToArray, TransformToBoolean, TransformToNumber } from 'src/decorators';

export class CreatePersonalAccessTokenDto {
  @cv.IsString()
  @cv.IsNotEmpty()
  @cv.MaxLength(255)
  @ApiProperty({ example: 'Logs token' })
  name: string;

  @cv.IsArray()
  @cv.ArrayNotEmpty()
  @cv.IsString({ each: true })
  @TransformToArray()
  @ApiProperty({ type: [String], example: ['logger:list'] })
  permissions: string[];

  @cv.IsOptional()
  @cv.IsNumber()
  @cv.Min(60)
  @TransformToNumber()
  @ApiPropertyOptional({ example: 2592000, description: 'TTL in seconds' })
  expires_in?: number;

  @cv.IsOptional()
  @cv.IsISO8601()
  @ApiPropertyOptional({
    example: '2026-06-30T12:00:00.000Z',
    description: 'Absolute expiration date in ISO 8601 format',
  })
  expires_at?: string;

  @cv.IsOptional()
  @cv.IsBoolean()
  @TransformToBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Create a token without expiration. It will stay active until revoked.',
  })
  never_expires?: boolean;
}
