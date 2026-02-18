import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import fs from 'fs';
import https from 'https';
import { AvatarService } from './avatar.service';

@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get('/:hashed_email')
  @ApiOperation({ summary: 'Get avatar' })
  async getAvatar(@Param('hashed_email') hashed_email: string, @Res() res: Response) {
    const avatar = await this.avatarService.getAvatar(hashed_email);

    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      https.get(avatar, (response) => {
        res.setHeader('Content-Type', response.headers['content-type']);
        response.pipe(res);
      });
      return;
    }

    const imageBuffer = await fs.promises.readFile(avatar);
    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(imageBuffer);
  }
}
