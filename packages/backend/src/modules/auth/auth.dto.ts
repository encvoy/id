import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsBooleanCustom } from '../../custom.dto';

export class InitiateOauthDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  provider_id: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  client_id?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  state: string;

  @IsBooleanCustom()
  @IsOptional()
  @ApiPropertyOptional()
  return_url?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  code_challenge?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  code_challenge_method?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  code_verifier?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  interaction_id?: string;
}

export class IdentifierDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : undefined))
  @ApiProperty({ example: 'Qwerty1234123' })
  identifier: string;
}

export class CheckIdentifierDto extends IdentifierDto {
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : undefined))
  @IsOptional()
  @ApiPropertyOptional()
  login?: string;
}
