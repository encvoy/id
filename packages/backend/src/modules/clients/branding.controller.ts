import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Response } from 'express';
import { BRANDING_ICON_SIZES, BrandingIconsService } from './branding-icons.service';

@common.Controller('v1/public/branding')
@swagger.ApiTags('Public branding')
export class BrandingController {
  constructor(private readonly brandingIconsService: BrandingIconsService) {}

  @common.Get('icon/:size')
  @swagger.ApiOperation({ summary: 'Get the system client branding icon' })
  @swagger.ApiParam({ name: 'size', enum: [...BRANDING_ICON_SIZES] })
  async getIcon(@common.Param('size') rawSize: string, @common.Res() res: Response) {
    const size = Number(rawSize);
    if (!this.brandingIconsService.isSupportedSize(size)) {
      throw new common.BadRequestException('Unsupported branding icon size');
    }

    const iconUrl = await this.brandingIconsService.getSystemIconUrl(size);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    return res.redirect(common.HttpStatus.FOUND, iconUrl);
  }
}
