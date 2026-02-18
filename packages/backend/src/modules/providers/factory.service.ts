import { Injectable, NotFoundException, Type } from '@nestjs/common';
import { Prisma, Provider, User } from '@prisma/client';
import { Request, Response } from 'express';
import path from 'path';
import { decodedBase64ImageData, loadModules } from 'src/helpers';
import { InitiateOauthDto } from '../auth/auth.dto';
import { EmailService } from './collection/email/email.service';
import { EthereumService } from './collection/ethereum/ethereum.service';
import { KloudService } from './collection/kloud/kloud.service';
import { MtlsService } from './collection/mtls';
import { CustomService, GoogleService } from './collection/oauth';
import { PhoneService } from './collection/phone';
import { HotpService, OtpService } from './collection/otp';
import { WebAuthnService } from './collection/webauthn';
import { PROVIDER_METADATA } from './providers.decorators';
import { BaseCreateProviderDto, BaseUpdateProviderDto } from './providers.dto';
import { GithubService } from './collection/oauth/github.service';
import { EmailCustomService } from './collection/emailc';

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
}

export interface IAuthResponse {
  user: User | undefined;
  renderWidgetParams?: {
    initialRoute: string;
    externalAccountInfo?: string;
  };
}

export interface IProvider {
  type: string;
  defaultUrlAvatar: string;

  getMethodDTO(methodName: string): Type<any> | null;
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
  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse>;
  confirm(device: string, code: string): Promise<void>;
  onActivate(provider: Provider): Promise<void>;
  getOauthLink?(provider: Provider, params: InitiateOauthDto, userId?: string): Promise<string>;
}

@Injectable()
export class ProviderFactory {
  private providers = new Map<string, IProvider>();

  constructor(
    private readonly emailService: EmailService,
    private readonly ethereumService: EthereumService,
    private readonly kloudService: KloudService,
    private readonly emailCustomService: EmailCustomService,
    private readonly phoneService: PhoneService,
    private readonly customService: CustomService,
    private readonly githubService: GithubService,
    private readonly googleService: GoogleService,
    private readonly totpService: OtpService,
    private readonly webauthnService: WebAuthnService,
    private readonly mtlsService: MtlsService,
    private readonly hotpService: HotpService,
    private readonly otpService: OtpService,
  ) {
    this.providers.set(emailService.type, emailService);
    this.providers.set(ethereumService.type, ethereumService);
    this.providers.set(kloudService.type, kloudService);
    this.providers.set(emailCustomService.type, emailCustomService);
    this.providers.set(phoneService.type, phoneService);
    this.providers.set(customService.type, customService);
    this.providers.set(githubService.type, githubService);
    this.providers.set(googleService.type, googleService);
    this.providers.set(totpService.type, totpService);
    this.providers.set(hotpService.type, hotpService);
    this.providers.set(webauthnService.type, webauthnService);
    this.providers.set(mtlsService.type, mtlsService);

    // Loading additional providers
    this.loadExtensionProviders('../../extensions');
  }

  private async loadExtensionProviders(pathFolder: string) {
    const fullPath = path.join(__dirname, pathFolder);
    await loadModules(fullPath, async (module) => {
      // Get all services with the "Service" suffix from the module
      const serviceKeys = Object.keys(module).filter((key) => key.endsWith('Service'));
      for (const serviceKey of serviceKeys) {
        const ServiceClass = module[serviceKey];

        // Check the metadata for the provider marker
        if (Reflect.hasMetadata(PROVIDER_METADATA, ServiceClass)) {
          const provider = new ServiceClass();
          this.registerProvider(provider);
        }
      }
    });
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
