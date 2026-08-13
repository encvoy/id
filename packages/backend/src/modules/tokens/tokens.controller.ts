import { Request, Response } from 'express';
import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Scope, UserId } from 'src/decorators';
import { prepareListResponse } from 'src/helpers';
import { ListInputDto } from '../../custom.dto';
import { CreatePersonalAccessTokenDto } from './tokens.dto';
import { TokensActions } from './tokens.roles';
import { TokensService } from './tokens.service';

type TTokenRequest = Request & {
  tokenPermissions?: string[];
};

@common.Controller('v1/tokens')
@swagger.ApiBearerAuth()
export class TokensController {
  constructor(private readonly service: TokensService) {}

  @common.Get('available-permissions')
  @swagger.ApiOperation({ summary: 'Get available permissions for additional tokens' })
  @Scope(TokensActions.create)
  async availablePermissions(@common.Req() req: TTokenRequest) {
    return this.service.getAvailablePermissions(req);
  }

  @common.Get()
  @swagger.ApiOperation({ summary: 'Get a list of additional tokens' })
  @Scope(TokensActions.list)
  async list(
    @common.Query() params: ListInputDto,
    @UserId() userId: string,
    @common.Res() res: Response,
  ) {
    const { items, totalCount } = await this.service.list(params, userId);
    return prepareListResponse(res, items, totalCount, params);
  }

  @common.Post()
  @swagger.ApiOperation({ summary: 'Create an additional access token' })
  @Scope(TokensActions.create)
  async create(@UserId() userId: string, @common.Body() body: CreatePersonalAccessTokenDto) {
    return this.service.create(userId, body);
  }

  @common.Delete(':token_id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Revoke an additional access token' })
  @Scope(TokensActions.delete)
  async revoke(@common.Param('token_id') tokenId: string, @UserId() userId: string) {
    await this.service.revoke(tokenId, userId);
  }
}
