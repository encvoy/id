import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

jest.mock('../../../../custom.dto', () => ({
  IsBooleanCustom: () => () => undefined,
  IsEmailCustom: () => () => undefined,
  IsLocalizedText: () => () => undefined,
}));

import { ParamsEmailDto } from './email.dto';

const createParams = (mailCodeTtlSec: string, mailPort = '465') =>
  plainToInstance(ParamsEmailDto, {
    root_mail: 'admin@example.com',
    mail_hostname: 'smtp.example.com',
    mail_port: mailPort,
    mail_password: 'secret',
    mail_code_ttl_sec: mailCodeTtlSec,
  });

describe('ParamsEmailDto', () => {
  it('accepts a positive integer confirmation-code TTL', () => {
    expect(validateSync(createParams('900'))).toHaveLength(0);
  });

  it.each(['1', '465', '65535'])('accepts outgoing mail server port %s', (value) => {
    expect(validateSync(createParams('900', value))).toHaveLength(0);
  });

  it.each(['0', '-1', '1.5', 'not-a-number', '12345678901'])(
    'rejects invalid confirmation-code TTL %s',
    (value) => {
      const errors = validateSync(createParams(value));

      expect(errors.some((error) => error.property === 'mail_code_ttl_sec')).toBe(true);
    },
  );

  it.each(['abc', '46a', '1.5', '-1', '0', '65536'])(
    'rejects invalid outgoing mail server port %s',
    (value) => {
      const errors = validateSync(createParams('900', value));

      expect(errors.some((error) => error.property === 'mail_port')).toBe(true);
    },
  );
});
