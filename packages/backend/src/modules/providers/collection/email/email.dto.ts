import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import * as classValidator from 'class-validator';
import { IsBooleanCustom, IsEmailCustom } from '../../../../custom.dto';
import { BaseCreateProviderDto, BaseParamsProviderDto, TypeProviderDTO } from '../../providers.dto';
import { Transform } from 'class-transformer';

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

  @classValidator.IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @ApiProperty()
  email: string;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: 'fCn3OxmkdlEBliBpD5znj' })
  uid?: string;

  @classValidator.IsEnum(MailCodeTypes)
  @ApiProperty({ enum: MailCodeTypes, example: 'role' })
  code_type: MailCodeTypes;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  user_id?: string;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: 'John' })
  name?: string;

  @classValidator.IsBoolean()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: 'true' })
  resend?: boolean;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: 'Trusted' })
  app_name?: string;

  @classValidator.IsNumber()
  @classValidator.IsOptional()
  @ApiPropertyOptional()
  timezone_offset?: number;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: 'client_id' })
  client_id?: string;

  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: 'provider_id' })
  provider_id?: string;
}

export class ParamsEmailDto extends BaseParamsProviderDto {
  @IsEmailCustom()
  root_mail: string;

  @classValidator.IsString()
  @classValidator.MaxLength(2000)
  @ApiProperty({ example: 'smtp.gmail.com' })
  mail_hostname: string;

  @classValidator.Matches(/^[^\n ]*$/, {
    message: 'The outgoing mail server port cannot contain spaces',
  })
  @classValidator.MaxLength(5)
  @classValidator.MinLength(1)
  @classValidator.IsString()
  @ApiProperty({ example: '465' })
  mail_port: string;

  @classValidator.IsString()
  @ApiProperty({ example: 'password' })
  mail_password: string;

  @classValidator.Matches(/^[^\n ]*$/, {
    message: 'The confirmation code TTL cannot contain spaces',
  })
  @classValidator.IsString()
  @ApiProperty({ example: '900' })
  mail_code_ttl_sec: string;
}

export class CreateEmailProviderDto extends BaseCreateProviderDto<ParamsEmailDto> {
  @classValidator.Equals('EMAIL')
  @ApiProperty({ example: 'EMAIL' })
  type: 'EMAIL';
}

export class UpdateEmailProviderDto extends PartialType(CreateEmailProviderDto) {}

export class InteractionEmailDto {
  @classValidator.IsString()
  @classValidator.IsOptional()
  @ApiPropertyOptional({ example: '232367' })
  code: string;

  @classValidator.IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @ApiProperty()
  email: string;
}
