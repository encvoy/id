import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  code: string;
}

export class DisableOtpDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  token: string;
}

export class RegenerateBackupCodesDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  token: string;
}

export class OtpStatusDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  userId: string;
}

export class OtpProviderQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  provider_id: string;
}
