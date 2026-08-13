import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import * as bcrypt from 'bcrypt';
import { Ei18nCodes, IdentifierType } from '../../enums';
import { prisma } from '../prisma';
import { ProviderFactory } from '../providers';
import {
  AuthServiceCheckUserCredentialsPayload,
  CallEventNames,
  CallEventsService,
} from '../call-events';
import { SettingsService } from '../settings/settings.service';
import { InitiateOauthDto } from './auth.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly providerFactory: ProviderFactory,
    private readonly callEventsService: CallEventsService,
  ) {}

  /**
   * Initializing the OAuth authorization process
   */
  public async initiateOauth(params: InitiateOauthDto, userId?: string) {
    const provider = await prisma.provider.findUnique({
      where: { id: params.provider_id },
    });

    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const providerService = this.providerFactory.getProviderService(provider.type);
    return providerService.getOauthLink(provider, params, userId);
  }

  public async checkUserIdentifier(
    identifier: string,
    ids?: string,
  ): Promise<{ is_active: boolean; identifier_type?: IdentifierType } | { error: string }> {
    const shouldCheckLoginIdentifier = Boolean(ids);
    const { user, identifierType } = await this.settingsService.getUserByIdentifier(
      identifier,
      shouldCheckLoginIdentifier,
      shouldCheckLoginIdentifier,
    );

    await this.settingsService.canAuthorize(user);
    return { is_active: true, identifier_type: identifierType };
  }

  public async checkUserCredentials(identifier: string, password: string) {
    const { user } = await this.settingsService.getUserByIdentifier(identifier, true, true);
    const callEventsResult = await this.callEventsService.call(
      CallEventNames.AuthService.checkUserCredentials,
      {
        identifier,
        password,
        user,
      } satisfies AuthServiceCheckUserCredentialsPayload,
    );

    if (callEventsResult.some((result) => result.handled)) {
      return user;
    }

    if (!(await bcrypt.compare(password, user.hashed_password))) {
      throw new ForbiddenException(Ei18nCodes.T3E0072);
    }

    if (user.deleted) {
      throw new ForbiddenException('DELETED');
    }

    return user;
  }
}
