import { Injectable, NotFoundException, OnApplicationBootstrap, Type } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { Prisma, Provider, User } from '@prisma/client';
import { Request, Response } from 'express';
import { decodedBase64ImageData } from 'src/helpers';
import { InitiateOauthDto } from '../auth/auth.dto';
import { PROVIDER_METADATA } from './providers.decorators';
import { BaseCreateProviderDto, BaseUpdateProviderDto } from './providers.dto';

export interface IProviderSchema {
  models: Type<any>[];
  schema: {
    oneOf: { $ref: string }[];
  };
}

export interface IUserMapping {
  login?: string;
  given_name: string;
  family_name?: string;
  email?: string;
  nickname?: string;
  custom_fields?: { [key: string]: string | number | boolean };
  avatarData?: decodedBase64ImageData;
  phone_number?: string;
  birthdate?: string;
}

export interface IExternalAccountInfo {
  sub: string;
  label: string;
  rest_info: object;
  avatarData?: decodedBase64ImageData;
}

export interface IUserInfo {
  userMapping: IUserMapping;
  externalAccountInfo: IExternalAccountInfo;
  certificateImport?: {
    certificates: unknown[];
    sourceEntryId: string;
    sourceDn?: string;
  };
}

export interface IAuthResponse {
  user: User | undefined;
  loginEmail?: string;
  renderWidgetParams?: {
    initialRoute: string;
    externalAccountInfo?: string;
  };
}

export interface IProvider {
  type: string;
  defaultUrlAvatar: string;

  onCreate(
    params: BaseCreateProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput>;
  onUpdate(
    params: BaseUpdateProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput>;
  getUserInfo?(login: string, password: string, provider: Provider): Promise<IUserInfo>;
  getTokenByCode?(
    code: string,
    provider: Provider,
    res: Response,
    req: Request,
  ): Promise<{ token: string; userinfo_endpoint: string }>;
  /**
   * Sending a confirmation code
   */
  verificationCode?(data: any, req: Request, res: Response): Promise<any>;
  /**
   * Checking availability
   */
  verificationStatus?(data: any): Promise<{ isExist: boolean; uniqueRule: boolean }>;
  onBindAccount(params: any, userId: string);
  onAuth(
    params: any,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse>;
  onSilentAuth?(
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse | null>;
  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse>;
  confirm(device: string, code: string): Promise<void>;
  onActivate(provider: Provider): Promise<void>;
  getOauthLink?(provider: Provider, params: InitiateOauthDto, userId?: string): Promise<string>;
}

@Injectable()
export class ProviderFactory implements OnApplicationBootstrap {
  private providers = new Map<string, IProvider>();

  constructor(private readonly discoveryService: DiscoveryService) {}

  onApplicationBootstrap() {
    this.registerDiscoveredProviders();
  }

  private registerDiscoveredProviders() {
    this.providers.clear();

    for (const wrapper of this.discoveryService.getProviders()) {
      if (!wrapper?.instance || !wrapper?.metatype) {
        continue;
      }

      if (!Reflect.hasMetadata(PROVIDER_METADATA, wrapper.metatype)) {
        continue;
      }

      this.registerProvider(wrapper.instance as IProvider);
    }
  }

  /**
   * Registering a provider in the factory
   */
  public registerProvider(provider: IProvider) {
    if (!provider.type) {
      return;
    }

    if (!this.providers.has(provider.type)) {
      this.providers.set(provider.type, provider);
    }
  }

  /**
   * Getting a provider by type
   */
  public getProviderService<T extends IProvider>(type: string): T {
    const provider = this.providers.get(type.toUpperCase());
    if (!provider) {
      throw new NotFoundException(`Provider ${type} not found`);
    }
    return provider as T;
  }
}
