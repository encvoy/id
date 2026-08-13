import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Equals, IsNumber, IsOptional, IsString } from 'class-validator';
import { EProviderTypes } from 'src/enums';
import { BaseCreateProviderDto, ProviderParamsDto } from '../../../providers.dto';

export class ParamsHOTPDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 6 })
  digits?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 0 })
  counter?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ default: 'SHA1' })
  algorithm?: string;
}

export class CreateHOTPProviderDto extends BaseCreateProviderDto<ParamsHOTPDto> {
  @Equals(EProviderTypes.HOTP)
  @ApiProperty({ enum: [EProviderTypes.HOTP] })
  type: EProviderTypes.HOTP;

  @ProviderParamsDto(ParamsHOTPDto)
  params?: ParamsHOTPDto;
}

export class UpdateParamsHOTPDto extends PartialType(ParamsHOTPDto, {
  skipNullProperties: false,
}) {}

export class UpdateHOTPProviderDto extends PartialType(
  OmitType(CreateHOTPProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsHOTPDto)
  params?: UpdateParamsHOTPDto;
}
