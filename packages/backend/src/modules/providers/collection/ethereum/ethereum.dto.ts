import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Equals, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  ProviderParamsDto,
} from '../../providers.dto';

export class GetNonceResDto {
  @IsNotEmpty()
  @ApiProperty()
  nonce: string;
}

/**
 * DTO for creating an Ethereum provider.
 */
export class CreateEthereumProviderDto extends BaseCreateProviderDto {
  @Equals('ETHEREUM')
  @ApiProperty({ example: 'ETHEREUM' })
  type: 'ETHEREUM';

  @ProviderParamsDto(BaseParamsProviderDto)
  params?: BaseParamsProviderDto;
}

export class UpdateParamsEthereumDto extends PartialType(BaseParamsProviderDto, {
  skipNullProperties: false,
}) {}

export class UpdateEthereumProviderDto extends PartialType(
  OmitType(CreateEthereumProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsEthereumDto)
  params?: UpdateParamsEthereumDto;
}

export class AddEthereumAccountDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '5ej45v6543qxctv' })
  address: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'vrjmtyut6ye5tyrtt' })
  signature: string;
}

export class AuthByEthereumDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '5ej45v6543qxctv' })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'vrjmtyut6ye5tyrtt' })
  signature?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '2' })
  provider_id: string;
}
