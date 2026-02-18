import { BadRequestException, Type } from '@nestjs/common';
import { ExternalAccount, Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { app } from 'src/main';
import { prisma } from '../prisma/prisma.client';
import { SettingsService } from '../settings';
import { IAuthResponse, IProvider, IUserInfo } from './factory.service';
import { IsProvider, PROVIDER_METHOD_METADATA } from './providers.decorators';
import { BaseCreateProviderDto, BaseUpdateProviderDto } from './providers.dto';
import { Ei18nCodes } from 'src/enums';

@IsProvider()
export abstract class ProviderBase implements IProvider {
  protected _settingsService: SettingsService;
  abstract defaultUrlAvatar: string;

  get settingsService() {
    return app.get(SettingsService, { strict: false });
  }

  getUserInfo?(login: string, password: string, provider: Provider): Promise<IUserInfo> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  abstract onActivate(provider: Provider): Promise<void>;

  confirm(device: string, code: string): Promise<void> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  getTokenByCode?(
    code: string,
    provider: Provider,
    res: Response,
    req: Request,
  ): Promise<{ token: string; userinfo_endpoint: string }> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  verificationCode?(data: any, req: Request, res: Response): Promise<any> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  verificationStatus?(data: any): Promise<{ isExist: boolean; uniqueRule: boolean }> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  type: string;

  getMethodDTO(methodName: string): Type<any> | null {
    return Reflect.hasMetadata(PROVIDER_METHOD_METADATA, this, methodName)
      ? Reflect.getMetadata(PROVIDER_METHOD_METADATA, this, methodName)
      : null;
  }

  prepareProviderCreateInput(
    client_id: string,
    paramsUpdate: BaseCreateProviderDto,
  ): Prisma.ProviderCreateInput {
    return { Client: { connect: { client_id } }, ...paramsUpdate };
  }

  prepareProviderUpdateInput(paramsUpdate: BaseUpdateProviderDto): Prisma.ProviderUpdateInput {
    return paramsUpdate;
  }

  abstract onCreate(
    params: BaseCreateProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput>;

  abstract onUpdate(
    params: BaseUpdateProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput>;

  abstract onBindAccount(params: any, userId: string);
  abstract onAuth(
    params: any,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse>;

  abstract syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse>;

  async updateExternalAccount(
    { avatar, label, profile_link, rest_info }: Partial<ExternalAccount>,
    sub: string,
    issuer: string,
  ) {
    await prisma.externalAccount.updateMany({
      where: { sub, issuer },
      data: { avatar, label, rest_info, profile_link },
    });
  }
}
