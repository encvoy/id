import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsAnyUrl } from 'src/custom.dto';
import { BaseCreateProviderDto, BaseParamsProviderDto } from '../../providers.dto';

export class ParamsOauthDto extends BaseParamsProviderDto {
  @Matches(/^[^\n ]*$/, { message: 'The identifier cannot contain spaces' })
  @MaxLength(255)
  @MinLength(1)
  @IsString()
  @ApiProperty()
  external_client_id: string;

  @MaxLength(2550)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  scopes: string;

  @Matches(/^[^\n ]*$/, { message: 'The secret key cannot contain spaces' })
  @MaxLength(255)
  @MinLength(1)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  external_client_secret?: string;

  @MaxLength(2000)
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional()
  issuer?: string;

  @MaxLength(2000)
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional()
  redirect_uri?: string;

  @MaxLength(2000)
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional()
  authorization_endpoint?: string;

  @MaxLength(2000)
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional()
  token_endpoint?: string;

  @MaxLength(2000)
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional()
  userinfo_endpoint?: string;
}

export class CreateOauthProviderDto extends BaseCreateProviderDto<ParamsOauthDto> {
  @IsString()
  @ApiProperty()
  type: string;
}

export class UpdateOauthProviderDto extends PartialType(CreateOauthProviderDto) {}

export class BindExternalAccountDto {
  @IsString()
  @ApiProperty({ example: '2356546754' })
  sub: string;

  @IsString()
  @ApiProperty({ example: 'https://accounts.google.com' })
  issuer: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'John' })
  label?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Smith' })
  rest_info?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Smith' })
  avatar?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://github.com/id777770377' })
  profile_link?: string;
}

export class InteractionProviderDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty1234123' })
  token: string;

  @IsString()
  @ApiProperty({ example: '1' })
  provider_id: string;
}
