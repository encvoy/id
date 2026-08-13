import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as cv from 'class-validator';
import { IsEmailCustom } from 'src/custom.dto';
import { BaseCreateProviderDto, ProviderParamsDto, TypeProviderDTO } from '../../providers.dto';
import { MailCodeTypes, ParamsEmailDto } from '../email/email.dto';

export class CreateEmailCustomProviderDto extends BaseCreateProviderDto<ParamsEmailDto> {
  @cv.Equals('EMAIL_CUSTOM')
  @ApiProperty({ example: 'EMAIL_CUSTOM' })
  type: 'EMAIL_CUSTOM';

  @ProviderParamsDto(ParamsEmailDto)
  params?: ParamsEmailDto;
}

export class UpdateParamsEmailCustomDto extends PartialType(ParamsEmailDto, {
  skipNullProperties: false,
}) {}

export class UpdateEmailCustomProviderDto extends PartialType(
  OmitType(CreateEmailCustomProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsEmailCustomDto)
  params?: UpdateParamsEmailCustomDto;
}

export class VerificationStatusEmailDTO extends TypeProviderDTO {
  type: 'EMAIL_CUSTOM';

  @IsEmailCustom()
  email: string;
}

export class VerificationSendCodeEmailCustomDTO extends TypeProviderDTO {
  type: 'EMAIL_CUSTOM';

  @cv.IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @ApiProperty()
  email: string;

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'true' })
  resend?: boolean;

  @cv.IsNumber()
  @ApiProperty()
  timezone_offset?: number;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'client_id' })
  client_id: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'provider_id' })
  provider_id: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'provider_id' })
  uid: string;

  @cv.IsEnum(MailCodeTypes)
  @ApiProperty({ enum: MailCodeTypes, example: 'role' })
  code_type: MailCodeTypes;
}
