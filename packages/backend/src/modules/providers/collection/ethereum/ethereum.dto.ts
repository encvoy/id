import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Equals, IsOptional, IsString } from 'class-validator';
import { BaseCreateProviderDto } from '../../providers.dto';

export class GetNonceResDto {
  @ApiProperty()
  nonce: string;
}

/**
 * DTO для создания провайдера Ethereum
 */
export class CreateEthereumProviderDto extends BaseCreateProviderDto {
  @Equals('ETHEREUM')
  @ApiProperty({ example: 'ETHEREUM' })
  type: 'ETHEREUM';
}

export class UpdateEthereumProviderDto extends PartialType(CreateEthereumProviderDto) { }

export class AddEthereumAccountDto {
  @IsString()
  @ApiProperty({ example: '5ej45v6543qxctv' })
  address: string;

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

  @IsString()
  @ApiProperty({ example: '2' })
  provider_id: string;
}
