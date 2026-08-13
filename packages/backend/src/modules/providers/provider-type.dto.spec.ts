import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EProviderTypes } from 'src/enums';

jest.mock('../../custom.dto', () => ({
  IsAnyUrl: () => () => undefined,
  IsBooleanCustom: () => () => undefined,
  IsLocalizedText: () => () => undefined,
}));

import { CreateOauthProviderDto } from './collection/oauth/oauth.dto';
import { CreateHOTPProviderDto } from './collection/otp/hotp/hotp.dto';
import { CreateTOTPProviderDto } from './collection/otp/totp/totp.dto';

const providerPayload = (type: string) => ({
  type,
  name: { 'ru-RU': 'Тестовый провайдер' },
});

const typeErrors = (dto: object) =>
  validateSync(dto, { whitelist: true, forbidNonWhitelisted: true }).filter(
    (error) => error.property === 'type',
  );

describe('provider type DTO validation', () => {
  it('normalizes an OAuth provider type before validating it', () => {
    const dto = plainToInstance(CreateOauthProviderDto, providerPayload('google'));

    expect(dto.type).toBe(EProviderTypes.GOOGLE);
    expect(typeErrors(dto)).toHaveLength(0);
  });

  it('normalizes and accepts the TOTP provider type', () => {
    const dto = plainToInstance(CreateTOTPProviderDto, providerPayload('totp'));

    expect(dto.type).toBe(EProviderTypes.TOTP);
    expect(typeErrors(dto)).toHaveLength(0);
  });

  it('rejects another registered type for the TOTP provider DTO', () => {
    const dto = plainToInstance(CreateTOTPProviderDto, providerPayload('HOTP'));

    expect(typeErrors(dto)).toHaveLength(1);
  });

  it('normalizes and accepts the HOTP provider type', () => {
    const dto = plainToInstance(CreateHOTPProviderDto, providerPayload('hotp'));

    expect(dto.type).toBe(EProviderTypes.HOTP);
    expect(typeErrors(dto)).toHaveLength(0);
  });

  it('rejects another registered type for the HOTP provider DTO', () => {
    const dto = plainToInstance(CreateHOTPProviderDto, providerPayload('TOTP'));

    expect(typeErrors(dto)).toHaveLength(1);
  });
});
