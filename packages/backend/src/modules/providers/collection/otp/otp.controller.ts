import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Ei18nCodes, EProviderTypes } from 'src/enums';
import { UidNotUndefinedGuard } from 'src/middlewares/guards/uid.guard';
import { OidcService } from 'src/modules/oidc/oidc.service';
import { prisma } from 'src/modules/prisma';
import { OtpProviderQueryDto } from './common/otp.dto';
import { HotpService } from './hotp/hotp.service';
import { TotpService } from './totp/totp.service';

@Controller('interaction')
@UseGuards(UidNotUndefinedGuard)
export class InteractionOtpController {
  constructor(
    private readonly oidcService: OidcService,
    private readonly totpService: TotpService,
    private readonly hotpService: HotpService,
  ) {}

  @Get('/:uid/otp/setup')
  @ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @ApiOperation({ summary: 'Generate OTP setup data for widget flow' })
  @ApiOkResponse()
  @UseGuards(ThrottlerGuard)
  async setup(
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query() query: OtpProviderQueryDto,
  ) {
    if (!query.provider_id) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const { jti } = await this.oidcService.interactionDetails(req, res);

    if (uid !== jti) {
      throw new BadRequestException(Ei18nCodes.T3E0039);
    }

    const provider = await prisma.provider.findFirst({
      where: {
        id: query.provider_id,
        type: {
          in: [EProviderTypes.TOTP, EProviderTypes.HOTP],
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const otpService = provider.type === EProviderTypes.TOTP ? this.totpService : this.hotpService;
    res.setHeader('Cache-Control', 'no-store');

    return otpService.generateSetup(null, provider.id, {
      requiredAccountsInfoUid: req.cookies?.required_accounts_info_uid,
      requiredProviderIds: req.cookies?._req_ids,
      interactionId: uid,
    });
  }
}
