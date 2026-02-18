import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProviderFactory } from '../providers';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('v1/verification')
export class VerificationController {
  constructor(private readonly factory: ProviderFactory) {}

  @Post('code')
  @ApiOperation({ summary: 'Request verification code' })
  @UseGuards(ThrottlerGuard)
  async sendCode(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const provider = this.factory.getProviderService(body.type);
    const result = await provider.verificationCode(body, req, res);

    return res.send(result);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check identifier presence' })
  @UseGuards(ThrottlerGuard)
  async checkResource(@Query() query: any) {
    const provider = this.factory.getProviderService(query.type);
    return provider.verificationStatus(query);
  }
}
