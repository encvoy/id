import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import * as cv from 'class-validator';
import { IsEmailCustom } from '../../../../custom.dto';
import { ELocales } from '../../../../enums';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  ProviderParamsDto,
  TypeProviderDTO,
} from '../../providers.dto';

export enum MailCodeTypes {
  confirmEmail = 'confirmEmail',
  recoverPassword = 'recoverPassword',
}

export class EmailDTO {
  @IsEmailCustom()
  email: string;
}

export class VerificationStatusEmailDTO extends TypeProviderDTO {
  type: 'EMAIL';

  @IsEmailCustom()
  email: string;
}

export class VerificationSendCodeEmailDTO extends TypeProviderDTO {
  type: 'EMAIL';

  @cv.IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @ApiProperty()
  email: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'fCn3OxmkdlEBliBpD5znj' })
  uid?: string;

  @cv.IsEnum(MailCodeTypes)
  @ApiProperty({ enum: MailCodeTypes, example: 'role' })
  code_type: MailCodeTypes;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  user_id?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'John' })
  name?: string;

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'true' })
  resend?: boolean;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'Trusted' })
  app_name?: string;

  @cv.IsNumber()
  @cv.IsOptional()
  @ApiPropertyOptional()
  timezone_offset?: number;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'client_id' })
  client_id?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'provider_id' })
  provider_id?: string;
}

export class ParamsEmailDto extends BaseParamsProviderDto {
  @IsEmailCustom()
  root_mail: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @cv.MaxLength(2000)
  @ApiProperty({ example: 'smtp.example.com' })
  mail_hostname: string;

  @cv.IsNotEmpty()
  @cv.IsPort({
    message: 'The outgoing mail server port must be an integer from 1 to 65535',
  })
  @cv.Matches(/^(?!0+$)\d+$/, {
    message: 'The outgoing mail server port must be greater than 0',
  })
  @cv.MaxLength(5)
  @cv.IsString()
  @ApiProperty({ example: '465' })
  mail_port: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'password' })
  mail_password: string;

  @cv.IsNotEmpty()
  @cv.Matches(/^[1-9]\d*$/, {
    message: 'The confirmation code TTL must be a positive integer',
  })
  @cv.MaxLength(10)
  @cv.IsString()
  @ApiProperty({ example: '900' })
  mail_code_ttl_sec: string;

  @cv.IsString()
  @cv.MaxLength(255)
  @cv.IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ApiPropertyOptional({ example: 'Trusted Support' })
  alias?: string;
}

export class CreateEmailProviderDto extends BaseCreateProviderDto<ParamsEmailDto> {
  @cv.Equals('EMAIL')
  @ApiProperty({ example: 'EMAIL' })
  type: 'EMAIL';

  @ProviderParamsDto(ParamsEmailDto)
  params?: ParamsEmailDto;
}

export class UpdateParamsEmailDto extends PartialType(ParamsEmailDto, {
  skipNullProperties: false,
}) {}

export class UpdateEmailProviderDto extends PartialType(
  OmitType(CreateEmailProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsEmailDto)
  params?: UpdateParamsEmailDto;
}

export class InteractionEmailDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '232367' })
  code: string;

  @cv.IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @ApiProperty()
  email: string;
}

export class SendTestEmailDTO extends TypeProviderDTO {
  @cv.IsIn(['EMAIL', 'EMAIL_CUSTOM'])
  @ApiProperty({ enum: ['EMAIL', 'EMAIL_CUSTOM'], example: 'EMAIL' })
  type: 'EMAIL' | 'EMAIL_CUSTOM';

  @cv.ValidateNested()
  @Type(() => ParamsEmailDto)
  @ApiProperty({ type: ParamsEmailDto })
  params: ParamsEmailDto;
}

export class UpdateEmailTemplateDto {
  @cv.IsString()
  @cv.IsOptional()
  subject?: string;

  @cv.IsString()
  @cv.IsOptional()
  title?: string;

  @cv.IsString()
  content?: string;

  @cv.IsEnum(ELocales)
  @cv.IsOptional()
  locale?: ELocales;
}

export class PreviewEmailTemplateDto {
  @cv.IsString()
  @ApiProperty()
  content: string;
}

export class GetEmailTemplatesDto {
  @cv.IsEnum(ELocales)
  @cv.IsOptional()
  locale?: ELocales;
}
