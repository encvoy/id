import {
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger/dist';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { GetNonceResDto } from './ethereum.dto';
import { EthereumService } from './ethereum.service';
import { Ei18nCodes } from 'src/enums';
@Controller('/eth/v1')
export class EthereumController {
  constructor(private readonly ethereumService: EthereumService) {}

  @Get('/nonce/:address')
  @ApiOperation({ summary: 'Get nonce text for sign' })
  @ApiOkResponse({ type: GetNonceResDto })
  @UseGuards(ThrottlerGuard)
  async getNonce(@Param('address') address: string, @Res() res: Response) {
    try {
      const nonce = await this.ethereumService.createNonceForAddress(address);

      res.send({ nonce });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
        cause: e,
      });
    }
  }
}
