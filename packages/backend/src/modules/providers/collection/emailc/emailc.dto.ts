import { Equals, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseCreateProviderDto, TypeProviderDTO } from '../../providers.dto';
import { MailCodeTypes, ParamsEmailDto } from '../email/email.dto';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmailCustom } from 'src/custom.dto';

export class CreateEmailCustomProviderDto extends BaseCreateProviderDto<ParamsEmailDto> {
  @Equals('EMAIL_CUSTOM')
  @ApiProperty({ example: 'EMAIL_CUSTOM' })
  type: 'EMAIL_CUSTOM';
}

export class UpdateEmailCustomProviderDto extends PartialType(CreateEmailCustomProviderDto) {}

export class VerificationStatusEmailDTO extends TypeProviderDTO {
  type: 'EMAIL_CUSTOM';

  @IsEmailCustom()
  email: string;
}

export class VerificationSendCodeEmailCustomDTO extends TypeProviderDTO {
  type: 'EMAIL_CUSTOM';

  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @ApiProperty()
  email: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: 'true' })
  resend?: boolean;

  @IsNumber()
  @ApiProperty()
  timezone_offset?: number;

  @IsString()
  @ApiProperty({ example: 'client_id' })
  client_id: string;

  @IsString()
  @ApiProperty({ example: 'provider_id' })
  provider_id: string;

  @IsString()
  @ApiProperty({ example: 'provider_id' })
  uid: string;

  @IsEnum(MailCodeTypes)
  @ApiProperty({ enum: MailCodeTypes, example: 'role' })
  code_type: MailCodeTypes;
}
