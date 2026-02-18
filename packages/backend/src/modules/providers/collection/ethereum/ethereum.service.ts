import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { BadRequestException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from 'src/modules/prisma';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from '../../../../helpers';
import { REDIS_PREFIXES, RedisAdapter } from '../../../redis';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { ProviderMethod } from '../../providers.decorators';
import {
  AddEthereumAccountDto,
  AuthByEthereumDto,
  CreateEthereumProviderDto,
  UpdateEthereumProviderDto,
} from './ethereum.dto';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class EthereumService extends ProviderBase {
  defaultUrlAvatar: string = 'public/default/ethereum.svg';
  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  async onActivate(): Promise<void> {
    return;
  }
  type = 'ETHEREUM';

  ethNonceAdapter = new RedisAdapter(REDIS_PREFIXES.EthereumNonce);

  async onAuth(params: AuthByEthereumDto) {
    const { user, ...externalAccount } = await this.getUserAndExternalAccountByEthereumSign(
      params.address,
      params.signature,
    );

    const providerIdInt = parseInt(params.provider_id, 10);
    const provider = await prisma.provider.findUnique({ where: { id: providerIdInt } });

    if (isEmpty(externalAccount)) {
      const externalAccountInfo = JSON.stringify({
        provider_name: provider.name,
        type: provider.type,
        issuer: this.type,
        provider_id: providerIdInt,
        label: params.address,
        sub: params.address,
      });

      return {
        user,
        checkMissingAccounts: true,
        renderWidgetParams: {
          initialRoute: 'bind',
          externalAccountInfo,
        },
      };
    }
  }

  @ProviderMethod(CreateEthereumProviderDto)
  async onCreate(
    params: CreateEthereumProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    const uniqueProvider = await prisma.provider.findFirst({
      where: {
        client_id,
        type: this.type,
      },
    });

    if (uniqueProvider) {
      throw new BadRequestException(Ei18nCodes.T3E0062);
    }
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateEthereumProviderDto)
  async onUpdate(
    params: UpdateEthereumProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  async createNonceForAddress(address: string) {
    const nonce = uuidv4();
    const existingNonce = await this.ethNonceAdapter.get<{
      nonce: string;
    }>(address);

    if (existingNonce) await this.ethNonceAdapter.destroy(address);
    await this.ethNonceAdapter.upsert(address, { nonce }, 300);

    return nonce;
  }

  // @ProviderMethod(AddEthereumAccountDto)
  async onBindAccount(params: AddEthereumAccountDto, userId: string) {
    const { user, ...externalAccount } =
      (await this.getUserAndExternalAccountByEthereumSign(params.address, params.signature)) || {};

    if (!isEmpty(externalAccount) && 'id' in externalAccount) {
      if (user.id === parseInt(userId, 10)) return { success: false, binded_to_this_user: true };
      return { success: false, nickname: user.nickname };
    }

    return {
      sub: params.address,
      issuer: this.type,
      type: this.type,
      label: params.address,
    };
  }

  async getUserAndExternalAccountByEthereumSign(address: string, sign: string) {
    const { nonce } = await this.ethNonceAdapter.get<{
      nonce: string;
    }>(address);
    const hashedMessage = `0x${Buffer.from(
      'For authorization in service - sign nonce: ' + nonce,
      'utf8',
    ).toString('hex')}`;

    const signerAddress = recoverPersonalSignature({ data: hashedMessage, signature: sign });

    if (signerAddress !== address) throw new BadRequestException(Ei18nCodes.T3E0063);

    const data = await prisma.externalAccount.findFirst({
      where: { sub: signerAddress, issuer: this.type },
      select: {
        user: true,
        avatar: true,
        label: true,
        id: true,
      },
    });

    return data;
  }
}
