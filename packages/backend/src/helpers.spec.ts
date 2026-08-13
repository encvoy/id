jest.mock('./modules', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('src/main', () => ({
  app: {
    get: jest.fn(),
  },
}));

import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { IsString, IsNumber } from 'class-validator';
import fs from 'fs';
import path from 'path';
import * as helpers from './helpers';
import { IdentifierType, UserRoles } from './enums';
import { prisma } from './modules';
import { DOMAIN } from './constants';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('helpers', () => {
  describe('isEmpty', () => {
    it.each<{
      input: any;
      expected: boolean;
    }>([
      { input: {}, expected: true },
      { input: [], expected: true },
      { input: { key: 'value' }, expected: false },
      { input: [1, 2], expected: false },
      { input: null, expected: true },
      { input: '', expected: true },
      { input: ' ', expected: false },
      { input: undefined, expected: true },
      { input: '  ', expected: false },
    ])('isEmpty($input) -> $expected', ({ input, expected }) => {
      expect(helpers.isEmpty(input)).toBe(expected);
    });
  });

  describe('getIdentifierType', () => {
    test.each<{
      input: string | null | undefined;
      expected: IdentifierType | typeof Error;
    }>([
      { input: '1234567', expected: IdentifierType.ID },
      { input: ' +12025550123 ', expected: IdentifierType.PhoneNumber },
      { input: '    +12025550123', expected: IdentifierType.PhoneNumber },
      { input: '    +1(202)555-01 23', expected: IdentifierType.PhoneNumber },
      { input: '    +1(25)5-01 23', expected: IdentifierType.Login },
      { input: ' user@example.com ', expected: IdentifierType.Email },
      { input: '12345678', expected: IdentifierType.Login },
      { input: 'simpleLogin_s', expected: IdentifierType.Login },
      { input: '', expected: IdentifierType.Login },
      { input: ' ', expected: IdentifierType.Login },
      { input: '+1', expected: IdentifierType.Login },
      { input: '4@example.com', expected: IdentifierType.Email },
      { input: undefined, expected: Error },
      { input: null, expected: Error },
      { input: '+12345678901234567890987654', expected: IdentifierType.Login },
      { input: '+123456789012345678', expected: IdentifierType.PhoneNumber },
      { input: '4@logintoor', expected: IdentifierType.Email },
    ])('getIdentifierType($input) -> $expected', ({ input, expected }) => {
      if (expected === Error) {
        expect(() => helpers.getIdentifierType(input as string)).toThrow();
      } else {
        expect(helpers.getIdentifierType(input as string)).toBe(expected);
      }
    });
  });

  describe('prepareIdentifier', () => {
    test.each<{
      identifier: string | null | undefined;
      type: IdentifierType;
      expected: string | number | typeof BadRequestException | typeof TypeError;
    }>([
      // Validate the identifier.
      { identifier: '123', type: IdentifierType.ID, expected: 123 },
      { identifier: '12345678901234', type: IdentifierType.ID, expected: 12345678901234 },
      { identifier: 'number', type: IdentifierType.ID, expected: NaN },
      { identifier: ' ', type: IdentifierType.ID, expected: NaN },
      { identifier: null, type: IdentifierType.ID, expected: TypeError },
      { identifier: undefined, type: IdentifierType.ID, expected: TypeError },
      { identifier: '', type: IdentifierType.ID, expected: NaN },

      // Validate the email address.
      {
        identifier: 'user@example.com',
        type: IdentifierType.Email,
        expected: 'user@example.com',
      },
      {
        identifier: '',
        type: IdentifierType.Email,
        expected: '',
      },
      {
        identifier: null,
        type: IdentifierType.Email,
        expected: TypeError,
      },
      {
        identifier: undefined,
        type: IdentifierType.Email,
        expected: TypeError,
      },
      {
        identifier: ' USER@EXAMPLE.COM ',
        type: IdentifierType.Email,
        expected: 'user@example.com',
      },
      {
        identifier: ' @EXAMPLE.mail.COM ',
        type: IdentifierType.Email,
        expected: '@example.mail.com',
      },

      // Validate a string that does not match any supported type.
      { identifier: ' someLogin ', type: IdentifierType.Login, expected: 'someLogin' },
      // { identifier: ' some Login ', type: IdentifierType.Login, expected: 'someLogin' },
      { identifier: ' ', type: IdentifierType.Login, expected: '' },

      // Validate the phone number.
      {
        identifier: '8 (912) 345-67-89',
        type: IdentifierType.PhoneNumber,
        expected: '79123456789',
      },

      // The function does not validate phone numbers from this data set.
      // Add a format check if this behavior changes.
      {
        identifier: '8 (92) 34-67',
        type: IdentifierType.PhoneNumber,
        expected: BadRequestException,
      },

      {
        identifier: '+7 (912) 345-67-80',
        type: IdentifierType.PhoneNumber,
        expected: '79123456780',
      },
      {
        identifier: 'not-a-phone',
        type: IdentifierType.PhoneNumber,
        expected: BadRequestException,
      },
      {
        identifier: null,
        type: IdentifierType.PhoneNumber,
        expected: TypeError,
      },
      {
        identifier: undefined,
        type: IdentifierType.PhoneNumber,
        expected: TypeError,
      },
    ])('prepareIdentifier($identifier, $type) -> $expected', ({ identifier, type, expected }) => {
      if (expected === BadRequestException) {
        expect(() => helpers.prepareIdentifier(identifier as string, type)).toThrow(
          BadRequestException,
        );
      } else if (expected === TypeError) {
        expect(() => helpers.prepareIdentifier(identifier as string, type)).toThrow(TypeError);
      } else if (Number.isNaN(expected)) {
        expect(Number.isNaN(helpers.prepareIdentifier(identifier as string, type) as number)).toBe(
          true,
        );
      } else {
        expect(helpers.prepareIdentifier(identifier as string, type)).toEqual(expected);
      }
    });
  });

  describe('PHONE_REGEX', () => {
    test.each<{
      phone: string | null | undefined;
      expected: boolean;
    }>([
      { phone: '+7 912 345 67 89', expected: true },
      { phone: '8 (912) 345-67-89', expected: true },
      { phone: '+12025550123', expected: true },
      { phone: 'abc', expected: false },
      { phone: 'abc@example.com', expected: false },
      { phone: '12345', expected: false },
      { phone: '', expected: false },
      { phone: null, expected: false },
      { phone: undefined, expected: false },
      { phone: '8 (92) 34-67', expected: false },
      { phone: '7+9123456789', expected: false },
    ])('PHONE_REGEX.test($phone) -> $expected', ({ phone, expected }) => {
      expect(helpers.PHONE_REGEX.test(phone as unknown as string)).toBe(expected);
    });
  });

  describe('isMobilePhone', () => {
    test.each<{
      phone: string;
      expected: boolean;
    }>([
      // Valid Russian formats
      { phone: '+7 (912) 345-67-89', expected: true },
      { phone: '8 912 345-67-89', expected: true },
      { phone: '8 (912) 345-67-89', expected: true },
      { phone: '+7 912 345-67-89', expected: true },
      { phone: '89912345678', expected: true },
      { phone: '79912345678', expected: true },

      // Valid international formats with leading +
      { phone: '+79123456789', expected: true },
      { phone: '+12025550123', expected: true },
      { phone: '+4791234567', expected: true },

      // Length boundaries
      { phone: '+123456789', expected: true },
      { phone: '+123456789012345678', expected: true },
      { phone: '+12345678', expected: false },
      { phone: '+1234567890123456789', expected: false },

      // Invalid values
      { phone: '12345', expected: false },
      { phone: 'abc', expected: false },
      { phone: '', expected: false },
      { phone: '   ', expected: false },
      { phone: '+-() ', expected: false },
      { phone: '++79123456789', expected: true },
      { phone: '87+9123456789', expected: false },

      // Russian numbers that should fail current rule
      { phone: '78123456789', expected: false },
      { phone: '8912345678', expected: true },
    ])('isMobilePhone($phone) -> $expected', ({ phone, expected }) => {
      expect(helpers.isMobilePhone(phone)).toBe(expected);
    });
  });

  describe('preparePhoneNumber', () => {
    test.each<{
      phone: string | null | undefined;
      expected: string | null;
    }>([
      { phone: '8 (912) 345-67-89', expected: '79123456789' },
      { phone: '+7 (912) 345-67-89', expected: '79123456789' },
      { phone: '+7 (92) 34-67', expected: null },
      { phone: '9123456789', expected: '79123456789' },
      { phone: ' 9 123 456 789 ', expected: '79123456789' },
      { phone: '89991234567', expected: '79991234567' },
      { phone: '79991234567', expected: '79991234567' },
      { phone: '78123456789', expected: '78123456789' },
      { phone: '+12025550123', expected: '12025550123' },
      { phone: '+49 1512 3456789', expected: '4915123456789' },
      { phone: '0012025550123', expected: '0012025550123' },
      { phone: '+123456789', expected: '123456789' },
      { phone: '+123456789012345678', expected: '123456789012345678' },
      { phone: '+12345678', expected: null },
      { phone: '+1234567890123456789', expected: null },
      { phone: '', expected: null },
      { phone: '   ', expected: null },
      { phone: 'abc', expected: null },
      { phone: '+() -', expected: null },
      { phone: null, expected: null },
      { phone: undefined, expected: null },
    ])('preparePhoneNumber($phone) -> $expected', ({ phone, expected }) => {
      expect(helpers.preparePhoneNumber(phone)).toBe(expected);
    });
  });

  describe('getObjectKeys', () => {
    test.each<{
      input: Record<string, unknown> | string | null | undefined;
      expected: string[] | typeof TypeError;
    }>([
      { input: {}, expected: [] },
      { input: { a: 1, b: 'two' }, expected: ['a', 'b'] },
      { input: '', expected: [] },
      { input: undefined, expected: TypeError },
      { input: null, expected: TypeError },
    ])('getObjectKeys($input) -> $expected', ({ input, expected }) => {
      if (expected === TypeError) {
        expect(() => helpers.getObjectKeys(input as Record<string, unknown>)).toThrow(TypeError);
      } else {
        expect(helpers.getObjectKeys(input as Record<string, unknown>)).toEqual(expected);
      }
    });
  });

  describe('removeEmptyValues', () => {
    test.each<{
      input: unknown;
      expected: Record<string, unknown> | typeof TypeError;
    }>([
      {
        input: { a: 0, b: '', c: null, d: undefined, e: 'value', f: 123 },
        expected: { e: 'value', f: 123 },
      },
      {
        input: { empty: '', blank: '   ', zero: 0, ok: 'x', one: 1, yes: true, no: false },
        expected: { blank: '   ', ok: 'x', one: 1, yes: true },
      },
      { input: '', expected: {} },
      { input: '   ', expected: { 0: ' ', 1: ' ', 2: ' ' } },
      { input: undefined, expected: TypeError },
      { input: null, expected: TypeError },
    ])('removeEmptyValues($input) -> $expected', ({ input, expected }) => {
      if (expected === TypeError) {
        expect(() => helpers.removeEmptyValues(input as object)).toThrow(TypeError);
      } else {
        expect(helpers.removeEmptyValues(input as object)).toEqual(expected);
      }
    });
  });

  describe('getCnFromString', () => {
    test.each<{
      value: string | null | undefined;
      expected: string | null;
    }>([
      { value: 'CN=John Doe,OU=IT', expected: 'John Doe' },
      { value: '/CN=Jane Doe/O=Org', expected: 'Jane Doe' },
      { value: 'CN=John\\, Doe,OU=IT', expected: 'John, Doe' },
      { value: 'CN=John\\/Dev,OU=IT', expected: 'John/Dev' },
      { value: '  CN =  Alice  ,OU=QA', expected: 'Alice' },
      { value: 'cn=Bob,OU=IT', expected: 'Bob' },
      { value: 'OU=IT,O=Org', expected: null },
      { value: 'CN=   ,OU=IT', expected: null },
      { value: '', expected: null },
      { value: '   ', expected: null },
      { value: undefined, expected: null },
      { value: null, expected: null },
    ])('getCnFromString($value) -> $expected', ({ value, expected }) => {
      expect(helpers.getCnFromString(value)).toBe(expected);
    });
  });

  describe('generateRandomDigits', () => {
    test.each<{
      value: number | string | null | undefined;
      expected: number | { minLength: number; maxLength: number };
    }>([
      { value: undefined, expected: 6 },
      { value: '9', expected: 9 },
      { value: '2', expected: 2 },
      { value: '0', expected: { minLength: 1, maxLength: 6 } },
      { value: null, expected: { minLength: 1, maxLength: 6 } },
      { value: '', expected: { minLength: 1, maxLength: 6 } },
      { value: '   ', expected: { minLength: 1, maxLength: 6 } },
    ])('generateRandomDigits($value)', async ({ value, expected }) => {
      const result = await helpers.generateRandomDigits(value as unknown as number);

      if (typeof expected === 'number') {
        expect(result.length).toBe(expected);
      } else {
        expect(result.length).toBeGreaterThanOrEqual(expected.minLength);
        expect(result.length).toBeLessThanOrEqual(expected.maxLength);
      }

      expect(/^[0-9]+$/.test(result)).toBe(true);
    });
  });

  describe('generateRandomString', () => {
    test.each<{
      length: number | string | null | undefined;
      expectedLength: number;
    }>([
      { length: undefined, expectedLength: 34 },
      { length: 8, expectedLength: 8 },
      { length: 1, expectedLength: 1 },
      { length: 0, expectedLength: 0 },
      { length: -1, expectedLength: 0 },
      { length: null, expectedLength: 0 },
      { length: '', expectedLength: 0 },
      { length: '8', expectedLength: 8 },
      { length: '   ', expectedLength: 0 },
    ])('generateRandomString($length) -> $expectedLength', ({ length, expectedLength }) => {
      const result = helpers.generateRandomString(length as unknown as number);
      expect(result).toHaveLength(expectedLength);
      expect(/^[A-Za-z0-9]*$/.test(result)).toBe(true);
    });
  });

  describe('stringToBoolean', () => {
    test.each<{
      value: string | null | undefined;
      expected?: boolean;
      expectedError?: typeof SyntaxError;
    }>([
      { value: 'true', expected: true },
      { value: 'FALSE', expected: false },
      { value: 'TrUe', expected: true },
      { value: 'false', expected: false },
      { value: '1', expected: true },
      { value: '0', expected: false },
      { value: 'null', expected: false },
      { value: undefined, expected: undefined },
      { value: null, expected: undefined },
      { value: '', expected: undefined },
      { value: '   ', expectedError: SyntaxError },
      { value: 'yes', expectedError: SyntaxError },
    ])('stringToBoolean($value)', ({ value, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.stringToBoolean(value as unknown as string)).toThrow(expectedError);
      } else {
        expect(helpers.stringToBoolean(value as unknown as string)).toBe(expected);
      }
    });
  });

  describe('decodeBase64Image', () => {
    test.each<{
      value: string | null | undefined;
      expectedType?: string;
      shouldBeUndefined?: boolean;
    }>([
      { value: 'iVBORw0KGgoAAAA', expectedType: 'image/png' },
      { value: '/9jAAAA', expectedType: 'image/jpg' },
      { value: 'UklGRAAAA', expectedType: 'image/jpeg' },
      { value: 'Qk0AAAA', expectedType: 'image/bmp' },
      { value: 'RIFFAAAA', expectedType: 'image/webp' },
      { value: 'UktlGRiYAAABXRBmJnGb29/f3', shouldBeUndefined: true },
      { value: '', shouldBeUndefined: true },
      { value: '   ', shouldBeUndefined: true },
      { value: undefined, shouldBeUndefined: true },
      { value: null, shouldBeUndefined: true },
    ])('decodeBase64Image($value)', ({ value, expectedType, shouldBeUndefined }) => {
      const result = helpers.decodeBase64Image(value as unknown as string);

      if (shouldBeUndefined) {
        expect(result).toBeUndefined();
      } else {
        expect(result?.type).toBe(expectedType);
        expect(result?.base64).toBe(value);
        expect(Buffer.isBuffer(result?.data)).toBe(true);
      }
    });
  });

  describe('convertToRoles & role helpers', () => {
    test.each<{
      role: string | null | undefined;
      expected?: UserRoles;
      expectedError?: typeof TypeError;
    }>([
      { role: 'admin', expected: UserRoles.ADMIN },
      { role: 'EDITOR', expected: UserRoles.EDITOR },
      { role: 'Owner', expected: UserRoles.OWNER },
      { role: 'user', expected: UserRoles.USER },
      { role: 'trusted_user', expected: UserRoles.TRUSTED_USER },
      { role: 'unknown', expected: UserRoles.NONE },
      { role: '', expected: UserRoles.NONE },
      { role: '   ', expected: UserRoles.NONE },
      { role: undefined, expectedError: TypeError },
      { role: null, expectedError: TypeError },
    ])('convertToRoles($role)', ({ role, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.convertToRoles(role as unknown as string)).toThrow(expectedError);
      } else {
        expect(helpers.convertToRoles(role as string)).toBe(expected);
      }
    });

    test.each<{
      role: string | null | undefined;
      expected: boolean;
    }>([
      { role: UserRoles.ADMIN, expected: true },
      { role: UserRoles.OWNER, expected: true },
      { role: UserRoles.USER, expected: false },
      { role: UserRoles.EDITOR, expected: false },
      { role: UserRoles.TRUSTED_USER, expected: false },
      { role: UserRoles.NONE, expected: false },
      { role: '', expected: false },
      { role: '   ', expected: false },
      { role: undefined, expected: false },
      { role: null, expected: false },
    ])('isAdministrator($role) -> $expected', ({ role, expected }) => {
      expect(helpers.isAdministrator(role as unknown as string)).toBe(expected);
    });

    test.each<{
      role: string | null | undefined;
      expected: boolean;
    }>([
      { role: UserRoles.EDITOR, expected: true },
      { role: UserRoles.OWNER, expected: true },
      { role: UserRoles.USER, expected: false },
      { role: UserRoles.ADMIN, expected: false },
      { role: UserRoles.TRUSTED_USER, expected: false },
      { role: UserRoles.NONE, expected: false },
      { role: '', expected: false },
      { role: '   ', expected: false },
      { role: undefined, expected: false },
      { role: null, expected: false },
    ])('isEditor($role) -> $expected', ({ role, expected }) => {
      expect(helpers.isEditor(role as unknown as string)).toBe(expected);
    });
  });

  describe('arraysAreEqual', () => {
    test.each<{
      arr1: unknown;
      arr2: unknown;
      expected: boolean;
    }>([
      { arr1: [1, 2, 3], arr2: [1, 2, 3], expected: true },
      { arr1: [1, 2], arr2: [2, 1], expected: false },
      { arr1: [1, 2], arr2: [1, 2, 3], expected: false },
      { arr1: [1], arr2: null, expected: false },
      { arr1: [], arr2: [], expected: true },
      { arr1: undefined, arr2: [], expected: false },
      { arr1: [], arr2: undefined, expected: false },
      { arr1: null, arr2: null, expected: false },
      { arr1: '', arr2: '', expected: false },
      { arr1: '   ', arr2: '   ', expected: false },
      { arr1: [0, false, ''], arr2: [0, false, ''], expected: true },
      { arr1: [{ a: 1 }], arr2: [{ a: 1 }], expected: false },
    ])('arraysAreEqual($arr1, $arr2) -> $expected', ({ arr1, arr2, expected }) => {
      expect(helpers.arraysAreEqual(arr1 as any[], arr2 as any[])).toBe(expected);
    });
  });

  describe('isUrl', () => {
    test.each<{
      url: string | null | undefined;
      expected: boolean;
    }>([
      { url: 'https://example.com', expected: true },
      { url: 'http://localhost:3000/path?query=1', expected: true },
      { url: 'ftp://example.com', expected: true },
      { url: 'https://127.0.0.1:8080', expected: true },
      { url: 'https://sub.domain.co.uk/path', expected: true },
      { url: 'not-a-url', expected: false },
      { url: 'example.com', expected: false },
      { url: '', expected: false },
      { url: '   ', expected: false },
      { url: undefined, expected: false },
      { url: null, expected: false },
      { url: '/relative/path', expected: false },
    ])('isUrl($url) -> $expected', ({ url, expected }) => {
      expect(helpers.isUrl(url as unknown as string)).toBe(expected);
    });
  });

  describe('errorHandler', () => {
    test.each<{
      title: string;
      message: unknown;
      inputError: unknown;
      expectedSameError?: boolean;
      expectedStatus?: HttpStatus;
      expectedMessage?: string;
      expectedCause?: unknown;
    }>([
      {
        title: 'wraps standard Error into HttpException',
        message: 'message',
        inputError: new Error('boom'),
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        expectedMessage: 'message',
      },
      {
        title: 'wraps with empty message',
        message: '',
        inputError: new Error('empty message'),
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        expectedMessage: '',
      },
      {
        title: 'wraps with whitespace message',
        message: '   ',
        inputError: new TypeError('type error'),
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        expectedMessage: '   ',
      },
      {
        title: 'wraps plain object error',
        message: 'object error',
        inputError: { code: 'E_CUSTOM', details: 'failed' },
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        expectedMessage: 'object error',
      },
      {
        title: 'wraps undefined error payload',
        message: 'undefined error',
        inputError: undefined,
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        expectedMessage: 'undefined error',
      },
      {
        title: 'wraps with undefined message',
        message: undefined,
        inputError: new Error('boom'),
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      {
        title: 'wraps with null message',
        message: null,
        inputError: new Error('boom'),
        expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      {
        title: 'returns same HttpException instance (bad request)',
        message: 'other',
        inputError: new HttpException('oops', HttpStatus.BAD_REQUEST),
        expectedSameError: true,
      },
      {
        title: 'returns same HttpException instance with empty message',
        message: '',
        inputError: new HttpException('', HttpStatus.BAD_REQUEST),
        expectedSameError: true,
      },
      {
        title: 'returns same HttpException instance with whitespace message',
        message: '   ',
        inputError: new HttpException('space', HttpStatus.NOT_FOUND),
        expectedSameError: true,
      },
      {
        title: 'returns same HttpException instance when message is undefined',
        message: undefined,
        inputError: new HttpException('oops', HttpStatus.BAD_REQUEST),
        expectedSameError: true,
      },
      {
        title: 'returns same HttpException instance when message is null',
        message: null,
        inputError: new HttpException('oops', HttpStatus.BAD_REQUEST),
        expectedSameError: true,
      },
    ])(
      '$title',
      async ({ message, inputError, expectedSameError, expectedStatus, expectedMessage }) => {
        if (expectedSameError) {
          await expect(helpers.errorHandler(message as any, inputError)).rejects.toBe(inputError);
          return;
        }

        await expect(helpers.errorHandler(message as any, inputError)).rejects.toBeInstanceOf(
          HttpException,
        );

        try {
          await helpers.errorHandler(message as any, inputError);
          fail('Should have thrown HttpException');
        } catch (error) {
          const httpError = error as HttpException & { cause?: unknown };
          expect(httpError.getStatus()).toBe(expectedStatus ?? HttpStatus.INTERNAL_SERVER_ERROR);
          expect(httpError.cause).toBe(inputError);
          if (expectedMessage !== undefined) {
            expect(httpError.message).toBe(expectedMessage);
          }
        }
      },
    );
  });

  describe('escapeSpecCharsForPostgreSQL', () => {
    test.each<{
      input: string | null | undefined;
      expected?: string;
      expectedError?: typeof TypeError;
    }>([
      { input: 'normal_text', expected: 'normal\\_text' },
      { input: '50%', expected: '50\\%' },
      { input: 'back\\slash', expected: 'back\\\\slash' },
      { input: '_%%\\_', expected: '\\_\\%\\%\\\\\\_' },
      { input: 'no_special', expected: 'no\\_special' },
      { input: '', expected: '' },
      { input: '   ', expected: '   ' },
      { input: undefined, expectedError: TypeError },
      { input: null, expectedError: TypeError },
    ])('escapeSpecCharsForPostgreSQL($input)', ({ input, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.escapeSpecCharsForPostgreSQL(input as unknown as string)).toThrow(
          expectedError,
        );
      } else {
        expect(helpers.escapeSpecCharsForPostgreSQL(input as string)).toBe(expected);
      }
    });
  });

  describe('isLoginValid', () => {
    test.each<{
      login: string | null | undefined;
      expected?: boolean;
      expectedError?: typeof TypeError;
    }>([
      { login: 'validLogin', expected: true },
      { login: 'val', expected: true },
      { login: 'a@b', expected: false },
      { login: 'ab', expected: false },
      { login: 'a'.repeat(72), expected: false },
      { login: 'val  ', expected: true },
      { login: '   ', expected: false },
      { login: 'user123', expected: true },
      { login: 'admin_user', expected: true },
      { login: '', expected: false },
      { login: '  a', expected: true },
      { login: undefined, expectedError: TypeError },
      { login: null, expectedError: TypeError },
    ])('isLoginValid($login)', ({ login, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.isLoginValid(login as unknown as string)).toThrow(expectedError);
      } else {
        expect(helpers.isLoginValid(login as string)).toBe(expected);
      }
    });
  });

  describe('createSha256Hash', () => {
    test.each<{
      input: string | null | undefined;
      expectedHash?: string;
      expectedError?: RegExp;
    }>([
      {
        input: 'test',
        expectedHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      },
      {
        input: '',
        expectedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      { input: '   ' },
      { input: 'value' },
      { input: undefined, expectedError: /must be of type string/i },
      { input: null, expectedError: /must be of type string/i },
    ])('createSha256Hash($input)', ({ input, expectedHash, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.createSha256Hash(input as unknown as string)).toThrow(expectedError);
      } else {
        const hash = helpers.createSha256Hash(input as string);
        expect(hash).toHaveLength(64);
        expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);

        if (expectedHash !== undefined) {
          expect(hash).toBe(expectedHash);
        }
      }
    });

    test.each<{
      left: string;
      right: string;
      expectedEqual: boolean;
    }>([
      { left: 'value', right: 'value', expectedEqual: true },
      { left: '', right: '', expectedEqual: true },
      { left: '   ', right: '   ', expectedEqual: true },
      { left: 'value1', right: 'value2', expectedEqual: false },
      { left: '', right: ' ', expectedEqual: false },
    ])('hash compare: $left vs $right', ({ left, right, expectedEqual }) => {
      const leftHash = helpers.createSha256Hash(left);
      const rightHash = helpers.createSha256Hash(right);

      if (expectedEqual) {
        expect(leftHash).toBe(rightHash);
      } else {
        expect(leftHash).not.toBe(rightHash);
      }
    });
  });

  describe('hasClaim & deleteClaim', () => {
    test.each<{
      claims: string | null | undefined;
      claim: string | null | undefined;
      expected?: boolean;
      expectedError?: typeof TypeError;
    }>([
      { claims: 'read write delete', claim: 'read', expected: true },
      { claims: 'read write delete', claim: 'write', expected: true },
      { claims: 'read write delete', claim: 'delete', expected: true },
      { claims: 'read write delete', claim: 'execute', expected: false },
      { claims: '', claim: 'read', expected: false },
      { claims: '   ', claim: 'read', expected: false },
      { claims: 'read  write', claim: 'write', expected: true },
      { claims: 'read write', claim: '', expected: false },
      { claims: 'read write', claim: '   ', expected: false },
      { claims: 'read write', claim: undefined, expected: false },
      { claims: 'read write', claim: null, expected: false },
      { claims: undefined, claim: 'read', expectedError: TypeError },
      { claims: null, claim: 'read', expectedError: TypeError },
    ])('hasClaim($claims, $claim)', ({ claims, claim, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.hasClaim(claims as string, claim as string)).toThrow(expectedError);
      } else {
        expect(helpers.hasClaim(claims as string, claim as string)).toBe(expected);
      }
    });

    test.each<{
      claims: string | null | undefined;
      claim: string | null | undefined;
      expected?: string;
      expectedError?: typeof TypeError;
    }>([
      { claims: 'read write delete', claim: 'write', expected: 'read delete' },
      { claims: 'read write delete', claim: 'read', expected: 'write delete' },
      { claims: 'read write delete', claim: 'delete', expected: 'read write' },
      { claims: 'read', claim: 'read', expected: '' },
      { claims: 'read write', claim: 'execute', expected: 'read write' },
      { claims: '', claim: 'read', expected: '' },
      { claims: '   ', claim: 'read', expected: '' },
      { claims: 'read  write', claim: 'write', expected: 'read ' },
      { claims: 'read write', claim: '', expected: 'read write' },
      { claims: 'read write', claim: undefined, expected: 'read write' },
      { claims: 'read write', claim: null, expected: 'read write' },
      { claims: undefined, claim: 'read', expectedError: TypeError },
      { claims: null, claim: 'read', expectedError: TypeError },
    ])('deleteClaim($claims, $claim)', ({ claims, claim, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.deleteClaim(claims as string, claim as string)).toThrow(expectedError);
      } else {
        expect(helpers.deleteClaim(claims as string, claim as string)).toBe(expected);
      }
    });
  });

  describe('areObjectsEqual', () => {
    test.each<{
      left: unknown;
      right: unknown;
      expected?: boolean;
      expectedError?: typeof TypeError;
    }>([
      { left: { a: 1, b: 2 }, right: { a: 1, b: 2 }, expected: true },
      { left: { name: 'John', age: 30 }, right: { name: 'John', age: 30 }, expected: true },
      { left: { a: 1, b: 2 }, right: { a: 1, b: 3 }, expected: false },
      { left: { name: 'John' }, right: { name: 'Jane' }, expected: false },
      { left: { a: 1, b: 2 }, right: { a: 1 }, expected: false },
      { left: { a: 1 }, right: { a: 1, b: 2 }, expected: false },
      { left: {}, right: {}, expected: true },
      { left: {}, right: { a: 1 }, expected: false },
      { left: { a: undefined }, right: { a: undefined }, expected: true },
      { left: { a: null }, right: { a: null }, expected: true },
      { left: { a: 1, b: undefined }, right: { a: 1 }, expected: false },
      { left: '', right: '', expected: true },
      { left: '   ', right: '   ', expected: true },
      { left: '', right: 'a', expected: false },
      { left: 1, right: 2, expected: true },
      { left: undefined, right: {}, expectedError: TypeError },
      { left: {}, right: undefined, expectedError: TypeError },
      { left: null, right: {}, expectedError: TypeError },
      { left: {}, right: null, expectedError: TypeError },
    ])('areObjectsEqual($left, $right)', ({ left, right, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.areObjectsEqual(left as object, right as object)).toThrow(
          expectedError,
        );
      } else {
        expect(helpers.areObjectsEqual(left as object, right as object)).toBe(expected);
      }
    });
  });

  describe('permuteUnique', () => {
    test.each<{
      input: unknown;
      expected?: string[];
      expectedLength?: number;
      expectedIncludes?: string[];
      expectedError?: typeof TypeError;
    }>([
      {
        input: ['a', 'b'],
        expectedLength: 2,
        expectedIncludes: ['ab', 'ba'],
      },
      {
        input: ['a', 'a', 'b'],
        expectedLength: 3,
        expectedIncludes: ['aab', 'aba', 'baa'],
      },
      {
        input: ['x'],
        expected: ['x'],
      },
      {
        input: ['a', 'b', 'c'],
        expectedLength: 6,
        expectedIncludes: ['abc', 'acb', 'bac', 'bca', 'cab', 'cba'],
      },
      {
        input: [],
        expected: [''],
      },
      {
        input: ['', 'a'],
        expectedLength: 1,
        expectedIncludes: ['a'],
      },
      {
        input: [1, 2],
        expectedLength: 2,
        expectedIncludes: ['12', '21'],
      },
      {
        input: [null, 'a'],
        expected: ['a'],
      },
      {
        input: [undefined, 'a'],
        expected: ['a'],
      },
      {
        input: undefined,
        expectedError: TypeError,
      },
      {
        input: null,
        expectedError: TypeError,
      },
    ])(
      'permuteUnique($input)',
      ({ input, expected, expectedLength, expectedIncludes, expectedError }) => {
        if (expectedError) {
          expect(() => helpers.permuteUnique(input as any[])).toThrow(expectedError);
          return;
        }

        const result = helpers.permuteUnique(input as any[]);

        expect(new Set(result).size).toBe(result.length);

        if (expected !== undefined) {
          expect(result).toEqual(expected);
        }

        if (expectedLength !== undefined) {
          expect(result).toHaveLength(expectedLength);
        }

        if (expectedIncludes !== undefined) {
          expectedIncludes.forEach((item) => {
            expect(result).toContain(item);
          });
        }
      },
    );
  });

  describe('maskEmail', () => {
    test.each<{
      email: string | null | undefined;
      expected?: string;
      expectedError?: typeof TypeError;
    }>([
      { email: 'john@example.com', expected: 'j***n@example.com' },
      { email: 'jane.doe@domain.org', expected: 'j***e@domain.org' },
      { email: 'a@test.com', expected: 'a@test.com' },
      { email: 'ab@test.com', expected: 'ab@test.com' },
      { email: 'longemaildomain@corporate.co.uk', expected: 'l***n@corporate.co.uk' },
      { email: '', expected: '' },
      { email: '   ', expected: ' *** @undefined' },
      { email: 'user@', expected: 'u***r@' },
      { email: '@example.com', expected: '@example.com' },
      { email: 'plainaddress', expected: 'p***s@undefined' },
      { email: undefined, expectedError: TypeError },
      { email: null, expectedError: TypeError },
    ])('maskEmail($email)', ({ email, expected, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.maskEmail(email as unknown as string)).toThrow(expectedError);
      } else {
        expect(helpers.maskEmail(email as string)).toBe(expected);
      }
    });

    test.each<{
      email: string;
      domainPart: string;
    }>([
      { email: 'user@example.com', domainPart: '@example.com' },
      { email: 'john@domain.org', domainPart: '@domain.org' },
      { email: 'name@corporate.co.uk', domainPart: '@corporate.co.uk' },
      { email: 'name@corporate-co.ru', domainPart: '@corporate-co.ru' },
      { email: '@domain.com', domainPart: '@domain.com' },
      { email: 'a@domain.com', domainPart: '@domain.com' },
      { email: 'ab@domain.com', domainPart: '@domain.com' },
      { email: 'user@', domainPart: '@' },
    ])('maskEmail($email) contains $domainPart', ({ email, domainPart }) => {
      const masked = helpers.maskEmail(email);
      expect(masked).toContain(domainPart);
    });
  });

  describe('getOrganization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test.each<{
      title: string;
      input: unknown;
      mockedResults: unknown[];
      expectedResult?: unknown;
      expectedError?: typeof BadRequestException | typeof TypeError;
      expectedCalls: Array<{ where: { client_id: string } }>;
    }>([
      {
        title: 'returns organization by client_id when found',
        input: 'org-1',
        mockedResults: [{ client_id: 'org-1', parent_id: null }],
        expectedResult: { client_id: 'org-1', parent_id: null },
        expectedCalls: [{ where: { client_id: 'org-1' } }],
      },
      {
        title: 'returns passed organization object without db call when it has no parent',
        input: { client_id: 'org-2', parent_id: null },
        mockedResults: [],
        expectedResult: { client_id: 'org-2', parent_id: null },
        expectedCalls: [],
      },
      {
        title: 'returns parent from nested parent field without db call',
        input: {
          client_id: 'child-1',
          parent_id: 'parent-1',
          parent: { client_id: 'parent-1', parent_id: null },
        },
        mockedResults: [],
        expectedResult: { client_id: 'parent-1', parent_id: null },
        expectedCalls: [],
      },
      {
        title: 'loads parent from db when parent_id exists and nested parent is absent',
        input: { client_id: 'child-2', parent_id: 'parent-2' },
        mockedResults: [{ client_id: 'parent-2', parent_id: null }],
        expectedResult: { client_id: 'parent-2', parent_id: null },
        expectedCalls: [{ where: { client_id: 'parent-2' } }],
      },
      {
        title: 'loads child then parent when input is client_id of child organization',
        input: 'child-3',
        mockedResults: [
          { client_id: 'child-3', parent_id: 'parent-3' },
          { client_id: 'parent-3', parent_id: null },
        ],
        expectedResult: { client_id: 'parent-3', parent_id: null },
        expectedCalls: [{ where: { client_id: 'child-3' } }, { where: { client_id: 'parent-3' } }],
      },
      {
        title: 'returns organization object with empty client_id when parent is absent',
        input: { client_id: '', parent_id: null },
        mockedResults: [],
        expectedResult: { client_id: '', parent_id: null },
        expectedCalls: [],
      },
      {
        title: 'throws when organization by client_id is missing',
        input: 'missing-org',
        mockedResults: [null],
        expectedError: BadRequestException,
        expectedCalls: [{ where: { client_id: 'missing-org' } }],
      },
      {
        title: 'throws for empty client_id string when organization is missing',
        input: '',
        mockedResults: [null],
        expectedError: BadRequestException,
        expectedCalls: [{ where: { client_id: '' } }],
      },
      {
        title: 'throws for whitespace client_id string when organization is missing',
        input: '   ',
        mockedResults: [null],
        expectedError: BadRequestException,
        expectedCalls: [{ where: { client_id: '   ' } }],
      },
      {
        title: 'throws when input is undefined',
        input: undefined,
        mockedResults: [],
        expectedError: BadRequestException,
        expectedCalls: [],
      },
      {
        title: 'throws when input is null',
        input: null,
        mockedResults: [],
        expectedError: BadRequestException,
        expectedCalls: [],
      },
      {
        title: 'throws TypeError when parent_id exists but parent organization is missing',
        input: { client_id: 'child-4', parent_id: 'parent-4' },
        mockedResults: [null],
        expectedError: TypeError,
        expectedCalls: [{ where: { client_id: 'parent-4' } }],
      },
    ])('$title', async ({ input, mockedResults, expectedResult, expectedError, expectedCalls }) => {
      mockedResults.forEach((value) => {
        (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce(value as any);
      });

      if (expectedError) {
        await expect(helpers.getOrganization(input as any)).rejects.toThrow(expectedError);
      } else {
        const result = await helpers.getOrganization(input as any);
        expect(result).toEqual(expectedResult);
      }

      expect(prisma.client.findUnique).toHaveBeenCalledTimes(expectedCalls.length);
      expectedCalls.forEach((call, index) => {
        expect(prisma.client.findUnique).toHaveBeenNthCalledWith(index + 1, call);
      });
    });
  });

  describe('duplicateProviderAvatarForExternalAccount', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (uuidv4 as jest.Mock).mockReturnValue('fixed-uuid');
    });

    test.each<{
      title: string;
      input: string | null | undefined;
      expected: string | null | undefined;
    }>([
      { title: 'returns undefined as-is', input: undefined, expected: undefined },
      { title: 'returns null as-is', input: null, expected: null },
      { title: 'returns empty string as-is', input: '', expected: '' },
      { title: 'returns whitespace string as-is', input: '   ', expected: '   ' },
      {
        title: 'returns input when provider marker is missing',
        input: 'https://example.com/other/path/avatar.png',
        expected: 'https://example.com/other/path/avatar.png',
      },
      {
        title: 'returns input when provider path is missing after marker',
        input: 'https://host/public/images/provider/',
        expected: 'https://host/public/images/provider/',
      },
      {
        title: 'returns input when provider path exists only in query string',
        input: 'https://host/avatar.png?next=public/images/provider/a/b.png',
        expected: 'https://host/avatar.png?next=public/images/provider/a/b.png',
      },
    ])('$title', async ({ input, expected }) => {
      const result = await helpers.duplicateProviderAvatarForExternalAccount(input as any);
      expect(result).toBe(expected);
    });

    test.each<{
      input: string;
      expectedExtension: string;
    }>([
      {
        input: 'https://host/public/images/provider/a/b/avatar.png?cache=1',
        expectedExtension: '.png',
      },
      {
        input: 'https://host/public/images/provider/x/y/photo.jpeg',
        expectedExtension: '.jpeg',
      },
      {
        input: 'https://host/public/images/provider/noext',
        expectedExtension: '.png',
      },
    ])(
      'copies file and returns new external avatar url: $input',
      async ({ input, expectedExtension }) => {
        const copySpy = jest.spyOn(fs.promises, 'copyFile').mockResolvedValue(undefined);

        const result = await helpers.duplicateProviderAvatarForExternalAccount(input);

        const providerAvatarPath = input.split('public/images/provider/')[1]?.split('?')[0];
        const expectedSourcePath = path.join(
          process.cwd(),
          'public',
          'images',
          'provider',
          ...providerAvatarPath.split('/'),
        );
        const expectedTargetPath = path.join(
          process.cwd(),
          'public',
          'images',
          'externalAccount',
          `fixed-uuid${expectedExtension}`,
        );

        expect(copySpy).toHaveBeenCalledTimes(1);
        expect(copySpy).toHaveBeenCalledWith(expectedSourcePath, expectedTargetPath);
        expect(result).toBe(
          `${DOMAIN}/public/images/externalAccount/fixed-uuid${expectedExtension}`,
        );
      },
    );

    test.each<{
      input: string;
      errorMessage: string;
    }>([
      {
        input: 'https://host/public/images/provider/a/b/avatar.png?cache=1',
        errorMessage: 'copy failed',
      },
      {
        input: 'https://host/public/images/provider/noext',
        errorMessage: 'disk full',
      },
    ])('returns original avatar when copy fails: $input', async ({ input, errorMessage }) => {
      jest.spyOn(fs.promises, 'copyFile').mockRejectedValue(new Error(errorMessage));

      const result = await helpers.duplicateProviderAvatarForExternalAccount(input);

      expect(result).toBe(input);
    });
  });

  describe('saveExternalAccountImageOnAuth', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (uuidv4 as jest.Mock).mockReturnValue('fixed-uuid');
    });

    test.each<{
      avatarData: unknown;
      avatar: unknown;
      expected: { savePath: string | null | undefined; imagesAreEqual: boolean };
    }>([
      {
        avatarData: undefined,
        avatar: undefined,
        expected: { savePath: null, imagesAreEqual: true },
      },
      {
        avatarData: null,
        avatar: undefined,
        expected: { savePath: null, imagesAreEqual: true },
      },
      {
        avatarData: '',
        avatar: undefined,
        expected: { savePath: null, imagesAreEqual: true },
      },
      {
        avatarData: undefined,
        avatar: 'https://host/public/images/externalAccount/old.png',
        expected: { savePath: null, imagesAreEqual: false },
      },
      {
        avatarData: undefined,
        avatar: '',
        expected: { savePath: null, imagesAreEqual: true },
      },
      {
        avatarData: undefined,
        avatar: '   ',
        expected: { savePath: null, imagesAreEqual: false },
      },
    ])(
      'handles falsy avatarData: avatarData=$avatarData, avatar=$avatar',
      async ({ avatarData, avatar, expected }) => {
        const result = await helpers.saveExternalAccountImageOnAuth(
          avatarData as any,
          avatar as any,
        );
        expect(result).toEqual(expected);
      },
    );

    test.each<{
      title: string;
      avatarData: unknown;
      avatar: unknown;
      writeFileRejects?: boolean;
      expected: { savePath: string | null | undefined; imagesAreEqual: boolean };
    }>([
      {
        title: 'returns new savePath and imagesAreEqual=false when upload succeeds',
        avatarData: {
          type: 'image/png',
          base64: 'iVBORw0KGgoAAAA',
          data: Buffer.from('abc'),
        },
        avatar: 'https://host/public/images/externalAccount/old.png',
        expected: {
          savePath: `${DOMAIN}/public/images/externalAccount/fixed-uuid.png`,
          imagesAreEqual: false,
        },
      },
      {
        title: 'returns savePath=undefined and imagesAreEqual=true when writeFile fails',
        avatarData: {
          type: 'image/png',
          base64: 'iVBORw0KGgoAAAA',
          data: Buffer.from('abc'),
        },
        avatar: 'https://host/public/images/externalAccount/old.png',
        writeFileRejects: true,
        expected: {
          savePath: undefined,
          imagesAreEqual: true,
        },
      },
      {
        title: 'returns savePath=undefined for incomplete avatarData without type',
        avatarData: {
          base64: 'iVBORw0KGgoAAAA',
          data: Buffer.from('abc'),
        },
        avatar: 'https://host/public/images/externalAccount/old.png',
        expected: {
          savePath: undefined,
          imagesAreEqual: true,
        },
      },
      {
        title: 'returns savePath=undefined for incomplete avatarData with empty type',
        avatarData: {
          type: '',
          base64: 'iVBORw0KGgoAAAA',
          data: Buffer.from('abc'),
        },
        avatar: 'https://host/public/images/externalAccount/old.png',
        expected: {
          savePath: undefined,
          imagesAreEqual: true,
        },
      },
    ])('$title', async ({ avatarData, avatar, writeFileRejects, expected }) => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      if (writeFileRejects) {
        jest.spyOn(fs.promises, 'writeFile').mockRejectedValue(new Error('write failed'));
      } else {
        jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
      }

      const result = await helpers.saveExternalAccountImageOnAuth(avatarData as any, avatar as any);
      expect(result).toEqual(expected);
    });
  });

  describe('uploadExternalAccountImage', () => {
    const imageData = {
      type: 'image/png',
      base64: 'iVBORw0KGgoAAAA',
      data: Buffer.from('abc'),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (uuidv4 as jest.Mock).mockReturnValue('fixed-uuid');
    });

    test.each<{
      title: string;
      inputImageData: unknown;
      oldImageName?: string | null;
      accessExists?: boolean;
      oldBase64?: string;
      writeRejects?: boolean;
      expectedResult?: string;
      expectedWriteCalls: number;
      expectErrorLog?: boolean;
    }>([
      {
        title: 'writes new image when oldImageName is undefined',
        inputImageData: imageData,
        oldImageName: undefined,
        expectedResult: 'fixed-uuid.png',
        expectedWriteCalls: 1,
      },
      {
        title: 'writes new image when oldImageName is empty string',
        inputImageData: imageData,
        oldImageName: '',
        expectedResult: 'fixed-uuid.png',
        expectedWriteCalls: 1,
      },
      {
        title: 'writes image when old image file does not exist',
        inputImageData: imageData,
        oldImageName: 'old.png',
        accessExists: false,
        expectedResult: 'fixed-uuid.png',
        expectedWriteCalls: 1,
      },
      {
        title: 'does not rewrite when old image content is equal',
        inputImageData: imageData,
        oldImageName: 'old.png',
        accessExists: true,
        oldBase64: imageData.base64,
        expectedResult: undefined,
        expectedWriteCalls: 0,
      },
      {
        title: 'rewrites image when old image content is different',
        inputImageData: imageData,
        oldImageName: 'old.png',
        accessExists: true,
        oldBase64: 'DIFFERENT_BASE64',
        expectedResult: 'fixed-uuid.png',
        expectedWriteCalls: 1,
      },
      {
        title: 'returns undefined when image type is invalid',
        inputImageData: {
          type: 'image',
          base64: 'abc',
          data: Buffer.from('abc'),
        },
        oldImageName: 'old.png',
        expectedResult: undefined,
        expectedWriteCalls: 0,
        expectErrorLog: true,
      },
      {
        title: 'returns undefined for undefined imageData',
        inputImageData: undefined,
        oldImageName: 'old.png',
        expectedResult: undefined,
        expectedWriteCalls: 0,
        expectErrorLog: true,
      },
      {
        title: 'returns undefined for null imageData',
        inputImageData: null,
        oldImageName: 'old.png',
        expectedResult: undefined,
        expectedWriteCalls: 0,
        expectErrorLog: true,
      },
      {
        title: 'returns undefined for missing type in imageData',
        inputImageData: {
          base64: 'abc',
          data: Buffer.from('abc'),
        },
        oldImageName: 'old.png',
        expectedResult: undefined,
        expectedWriteCalls: 0,
        expectErrorLog: true,
      },
      {
        title: 'returns undefined when writeFile fails',
        inputImageData: imageData,
        oldImageName: undefined,
        writeRejects: true,
        expectedResult: undefined,
        expectedWriteCalls: 1,
        expectErrorLog: true,
      },
    ])(
      '$title',
      async ({
        inputImageData,
        oldImageName,
        accessExists,
        oldBase64,
        writeRejects,
        expectedResult,
        expectedWriteCalls,
        expectErrorLog,
      }) => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        if (accessExists !== undefined) {
          if (accessExists) {
            jest.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
          } else {
            jest.spyOn(fs.promises, 'access').mockRejectedValue(new Error('not found'));
          }
        }

        if (oldBase64 !== undefined) {
          jest.spyOn(fs.promises, 'readFile').mockResolvedValue(oldBase64 as any);
        }

        const writeSpy = writeRejects
          ? jest.spyOn(fs.promises, 'writeFile').mockRejectedValue(new Error('write failed'))
          : jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

        const result = await helpers.uploadExternalAccountImage(
          inputImageData as any,
          oldImageName as any,
        );

        expect(result).toBe(expectedResult);
        expect(writeSpy).toHaveBeenCalledTimes(expectedWriteCalls);

        if (expectErrorLog) {
          expect(errorSpy).toHaveBeenCalled();
        }
      },
    );
  });

  describe('deleteImageFromLocalPath', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test.each<{
      title: string;
      paths: Array<string | null | undefined>;
      expectedUnlinkCalls: number;
      expectedContains: string[];
    }>([
      {
        title: 'deletes only valid non-default paths under public/images',
        paths: [
          '',
          'https://host/other/path/avatar.png',
          'https://host/public/images/default/avatar.png',
          'https://host/public/images/provider/a/b/avatar.png',
          'https://host/public/images/provider/avatar.jpeg',
        ],
        expectedUnlinkCalls: 2,
        expectedContains: [
          path.join('public', 'images', 'provider', 'a', 'b', 'avatar.png'),
          path.join('public', 'images', 'provider', 'avatar.jpeg'),
        ],
      },
      {
        title: 'skips undefined null and empty values',
        paths: [undefined, null, '', '   '],
        expectedUnlinkCalls: 0,
        expectedContains: [],
      },
      {
        title: 'skips paths without public/images marker',
        paths: ['avatar.png', 'https://host/images/provider/avatar.png'],
        expectedUnlinkCalls: 0,
        expectedContains: [],
      },
      {
        title: 'skips default images even with valid marker',
        paths: [
          'https://host/public/images/default/avatar.png',
          'https://host/public/images/provider/default/avatar.png',
        ],
        expectedUnlinkCalls: 0,
        expectedContains: [],
      },
      {
        title: 'processes non-file path under public/images',
        paths: ['https://host/public/images/'],
        expectedUnlinkCalls: 1,
        expectedContains: [path.join('public', 'images')],
      },
    ])('$title', async ({ paths, expectedUnlinkCalls, expectedContains }) => {
      const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);

      await helpers.deleteImageFromLocalPath(...(paths as string[]));

      expect(unlinkSpy).toHaveBeenCalledTimes(expectedUnlinkCalls);
      expectedContains.forEach((part) => {
        expect(unlinkSpy).toHaveBeenCalledWith(expect.stringContaining(part));
      });
    });

    test.each<{
      title: string;
      paths: string[];
      unlinkImplementation: 'always-fail' | 'first-fail-then-success';
      expectedUnlinkCalls: number;
      expectedErrorCalls: number;
    }>([
      {
        title: 'does not throw when path matches public/images but file does not exist',
        paths: ['https://host/public/images/provider/missing-file.png'],
        unlinkImplementation: 'always-fail',
        expectedUnlinkCalls: 1,
        expectedErrorCalls: 1,
      },
      {
        title: 'continues processing when unlink fails for one path',
        paths: [
          'https://host/public/images/provider/first.png',
          'https://host/public/images/provider/second.png',
        ],
        unlinkImplementation: 'first-fail-then-success',
        expectedUnlinkCalls: 2,
        expectedErrorCalls: 1,
      },
    ])(
      '$title',
      async ({ paths, unlinkImplementation, expectedUnlinkCalls, expectedErrorCalls }) => {
        const unlinkSpy = jest.spyOn(fs.promises, 'unlink');
        if (unlinkImplementation === 'always-fail') {
          unlinkSpy.mockRejectedValue(
            Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
          );
        } else {
          unlinkSpy
            .mockRejectedValueOnce(new Error('unlink failed'))
            .mockResolvedValueOnce(undefined);
        }

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        await expect(helpers.deleteImageFromLocalPath(...paths)).resolves.toBeUndefined();

        expect(unlinkSpy).toHaveBeenCalledTimes(expectedUnlinkCalls);
        expect(errorSpy).toHaveBeenCalledTimes(expectedErrorCalls);
        expect(errorSpy).toHaveBeenCalledWith(
          'deleteImageFromLocalPath error: ',
          expect.any(Error),
        );
      },
    );
  });

  describe('getObjectEntries', () => {
    test.each<{
      title: string;
      input: unknown;
      expected?: Array<[string, unknown]>;
      expectedLength?: number;
      expectedContains?: Array<[string, unknown]>;
      expectedError?: typeof TypeError;
    }>([
      {
        title: 'returns entries array from object',
        input: { a: 1, b: 'two', c: true },
        expectedLength: 3,
        expectedContains: [
          ['a', 1],
          ['b', 'two'],
          ['c', true],
        ],
      },
      {
        title: 'returns empty array for empty object',
        input: {},
        expected: [],
      },
      {
        title: 'handles objects with various value types',
        input: { num: 42, str: 'test', bool: false, nil: null, undef: undefined },
        expectedLength: 5,
        expectedContains: [
          ['num', 42],
          ['nil', null],
          ['undef', undefined],
          ['bool', false],
          ['str', 'test'],
        ],
      },
      {
        title: 'handles incomplete object values',
        input: { present: 'ok', missing: undefined },
        expectedLength: 2,
        expectedContains: [
          ['present', 'ok'],
          ['missing', undefined],
        ],
      },
      {
        title: 'returns empty entries for empty string',
        input: '',
        expected: [],
      },
      {
        title: 'returns indexed entries for whitespace string',
        input: '   ',
        expected: [
          ['0', ' '],
          ['1', ' '],
          ['2', ' '],
        ],
      },
      {
        title: 'throws for undefined input',
        input: undefined,
        expectedError: TypeError,
      },
      {
        title: 'throws for null input',
        input: null,
        expectedError: TypeError,
      },
    ])('$title', ({ input, expected, expectedLength, expectedContains, expectedError }) => {
      if (expectedError) {
        expect(() => helpers.getObjectEntries(input as any)).toThrow(expectedError);
        return;
      }

      const result = helpers.getObjectEntries(input as any);

      if (expected !== undefined) {
        expect(result).toEqual(expected);
      }

      if (expectedLength !== undefined) {
        expect(result).toHaveLength(expectedLength);
      }

      if (expectedContains !== undefined) {
        expectedContains.forEach((entry) => {
          expect(result).toContainEqual(entry);
        });
      }
    });
  });

  describe('isFileExists', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test.each<{
      title: string;
      inputPath: unknown;
      accessResult: 'resolve' | 'reject';
      accessError?: Error;
      expected: boolean;
    }>([
      {
        title: 'returns true when file exists',
        inputPath: '/path/to/file.txt',
        accessResult: 'resolve',
        expected: true,
      },
      {
        title: 'returns false when file does not exist',
        inputPath: '/path/to/missing.txt',
        accessResult: 'reject',
        accessError: new Error('ENOENT'),
        expected: false,
      },
      {
        title: 'returns false for permission denied',
        inputPath: '/restricted/path',
        accessResult: 'reject',
        accessError: new Error('Permission denied'),
        expected: false,
      },
      {
        title: 'returns false for empty path',
        inputPath: '',
        accessResult: 'reject',
        accessError: new Error('Path is empty'),
        expected: false,
      },
      {
        title: 'returns false for whitespace path',
        inputPath: '   ',
        accessResult: 'reject',
        accessError: new Error('Path is blank'),
        expected: false,
      },
      {
        title: 'returns false for undefined path',
        inputPath: undefined,
        accessResult: 'reject',
        accessError: new TypeError('Path must be a string'),
        expected: false,
      },
      {
        title: 'returns false for null path',
        inputPath: null,
        accessResult: 'reject',
        accessError: new TypeError('Path must be a string'),
        expected: false,
      },
    ])('$title', async ({ inputPath, accessResult, accessError, expected }) => {
      const accessSpy = jest.spyOn(fs.promises, 'access');
      if (accessResult === 'resolve') {
        accessSpy.mockResolvedValue(undefined as any);
      } else {
        accessSpy.mockRejectedValue(accessError ?? new Error('access failed'));
      }

      const result = await helpers.isFileExists(inputPath as any);

      expect(result).toBe(expected);
      expect(accessSpy).toHaveBeenCalledWith(inputPath);
    });
  });

  describe('findDtoEnv', () => {
    class FindDtoEnvDto {
      @IsString()
      name: string;
    }

    beforeEach(() => {
      jest.clearAllMocks();
      delete process.env['TEST_VAR'];
      delete process.env['TEST_VAR_INVALID'];
      delete process.env['TEST_VAR_EMPTY'];
      delete process.env['TEST_VAR_WHITESPACE'];
      delete process.env['TEST_VAR_DTO_INVALID'];
      delete process.env['undefined'];
      delete process.env['null'];
    });

    test.each<{
      title: string;
      envName: unknown;
      envValue?: string;
      dto?: new () => FindDtoEnvDto;
      expected?: unknown;
      expectedError?: typeof BadRequestException;
    }>([
      {
        title: 'returns null when environment variable is not set',
        envName: 'NON_EXISTENT_VAR',
        expected: null,
      },
      {
        title: 'returns null for undefined env name when variable is not set',
        envName: undefined,
        expected: null,
      },
      {
        title: 'returns null for null env name when variable is not set',
        envName: null,
        expected: null,
      },
      {
        title: 'returns null for empty env value',
        envName: 'TEST_VAR_EMPTY',
        envValue: '',
        expected: null,
      },
      {
        title: 'throws for whitespace-only env value',
        envName: 'TEST_VAR_WHITESPACE',
        envValue: '   ',
        expectedError: BadRequestException,
      },
      {
        title: 'parses JSON from environment variable without DTO',
        envName: 'TEST_VAR',
        envValue: JSON.stringify({ key: 'value', number: 42 }),
        expected: { key: 'value', number: 42 },
      },
      {
        title: 'validates with DTO when provided',
        envName: 'TEST_VAR',
        envValue: JSON.stringify({ name: 'test' }),
        dto: FindDtoEnvDto,
        expected: { name: 'test' },
      },
      {
        title: 'throws for invalid JSON',
        envName: 'TEST_VAR_INVALID',
        envValue: '{invalid json}',
        expectedError: BadRequestException,
      },
      {
        title: 'throws for DTO validation error when required field is missing',
        envName: 'TEST_VAR_DTO_INVALID',
        envValue: JSON.stringify({}),
        dto: FindDtoEnvDto,
        expectedError: BadRequestException,
      },
    ])('$title', ({ envName, envValue, dto, expected, expectedError }) => {
      if (envValue !== undefined) {
        process.env[String(envName)] = envValue;
      }

      if (expectedError) {
        expect(() => helpers.findDtoEnv(envName as string, dto as any)).toThrow(expectedError);
      } else {
        expect(helpers.findDtoEnv(envName as string, dto as any)).toEqual(expected);
      }
    });
  });

  // Not called by the application.
  // describe('getDtoEnv', () => {
  //   beforeEach(() => {
  //     jest.clearAllMocks();
  //     delete process.env['TEST_REQUIRED'];
  //   });

  //   it('throws BadRequestException when variable is not defined', () => {
  //     expect(() => getDtoEnv('UNDEFINED_VAR', class {} as any)).toThrow(BadRequestException);
  //     expect(() => getDtoEnv('UNDEFINED_VAR', class {} as any)).toThrow(
  //       `Variable 'UNDEFINED_VAR' is not defined`,
  //     );
  //   });

  //   it('returns parsed DTO when variable exists', () => {
  //     process.env['TEST_REQUIRED'] = JSON.stringify({ data: 'test' });

  //     const result = getDtoEnv('TEST_REQUIRED', Object as any);
  //     expect(result).toEqual({ data: 'test' });
  //   });
  // });

  describe('validateDto', () => {
    class TestDto {
      @IsString()
      name: string;

      @IsNumber()
      value: number;
    }

    test.each<{
      title: string;
      dto: unknown;
      schema: unknown;
      expectedError?: typeof BadRequestException | typeof TypeError;
    }>([
      {
        title: 'does not throw for valid DTO',
        dto: { name: 'test', value: 123 },
        schema: TestDto,
      },
      {
        title: 'does not throw for valid DTO with empty string and zero',
        dto: { name: '', value: 0 },
        schema: TestDto,
      },
      {
        title: 'throws for invalid DTO constraints',
        dto: { name: 123, value: 'not a number' },
        schema: TestDto,
        expectedError: BadRequestException,
      },
      {
        title: 'throws for missing required fields',
        dto: {},
        schema: TestDto,
        expectedError: BadRequestException,
      },
      {
        title: 'throws for incomplete DTO with only name',
        dto: { name: 'test' },
        schema: TestDto,
        expectedError: BadRequestException,
      },
      {
        title: 'throws for undefined dto',
        dto: undefined,
        schema: TestDto,
        expectedError: BadRequestException,
      },
      {
        title: 'throws for null dto',
        dto: null,
        schema: TestDto,
        expectedError: BadRequestException,
      },
      {
        title: 'throws TypeError for undefined schema',
        dto: { name: 'test', value: 1 },
        schema: undefined,
        expectedError: TypeError,
      },
      {
        title: 'throws TypeError for null schema',
        dto: { name: 'test', value: 1 },
        schema: null,
        expectedError: TypeError,
      },
    ])('$title', ({ dto, schema, expectedError }) => {
      if (expectedError) {
        try {
          helpers.validateDto(dto as any, schema as any);
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error).toBeInstanceOf(expectedError);
          if (expectedError === BadRequestException) {
            expect(error.message).toBeTruthy();
          }
        }
      } else {
        expect(() => helpers.validateDto(dto as any, schema as any)).not.toThrow();
      }
    });
  });

  describe('prepareListResponse', () => {
    test.each<{
      title: string;
      data: unknown[];
      total: number;
      params: unknown;
      responseType: 'full' | 'missing-set' | 'missing-json';
      expectedHeaders?: Record<string, number>;
      expectedError?: typeof TypeError;
    }>([
      {
        title: 'sets headers for explicit limit and offset',
        data: [{ id: 10 }],
        total: 3,
        params: { limit: 3, offset: 0 },
        responseType: 'full',
        expectedHeaders: {
          'X-Total-Count': 3,
          'X-Per-Page': 3,
          'X-Current-Offset': 0,
          'X-Next-Offset': 3,
        },
      },
      {
        title: 'applies fallback when limit is undefined',
        data: [{ id: 1 }],
        total: 100,
        params: { limit: undefined, offset: 5 },
        responseType: 'full',
        expectedHeaders: {
          'X-Total-Count': 100,
          'X-Per-Page': 10,
          'X-Current-Offset': 5,
          'X-Next-Offset': 15,
        },
      },
      {
        title: 'applies fallback when offset is undefined',
        data: [{ id: 1 }],
        total: 100,
        params: { limit: 20, offset: undefined },
        responseType: 'full',
        expectedHeaders: {
          'X-Total-Count': 100,
          'X-Per-Page': 20,
          'X-Current-Offset': 0,
          'X-Next-Offset': 20,
        },
      },
      {
        title: 'applies fallback when limit and offset are empty strings',
        data: [{ id: 1 }],
        total: 100,
        params: { limit: '', offset: '' },
        responseType: 'full',
        expectedHeaders: {
          'X-Total-Count': 100,
          'X-Per-Page': 10,
          'X-Current-Offset': 0,
          'X-Next-Offset': 10,
        },
      },
      {
        title: 'uses fallback when limit and offset are null',
        data: [{ id: 1 }],
        total: 100,
        params: { limit: null, offset: null },
        responseType: 'full',
        expectedHeaders: {
          'X-Total-Count': 100,
          'X-Per-Page': 10,
          'X-Current-Offset': 0,
          'X-Next-Offset': 10,
        },
      },
      {
        title: 'throws when params is undefined',
        data: [{ id: 1 }],
        total: 100,
        params: undefined,
        responseType: 'full',
        expectedError: TypeError,
      },
      {
        title: 'throws when params is null',
        data: [{ id: 1 }],
        total: 100,
        params: null,
        responseType: 'full',
        expectedError: TypeError,
      },
      {
        title: 'throws when response has no set method',
        data: [{ id: 1 }],
        total: 100,
        params: { limit: 10, offset: 0 },
        responseType: 'missing-set',
        expectedError: TypeError,
      },
      {
        title: 'throws when response has no json method',
        data: [{ id: 1 }],
        total: 100,
        params: { limit: 10, offset: 0 },
        responseType: 'missing-json',
        expectedError: TypeError,
      },
    ])('$title', ({ data, total, params, responseType, expectedHeaders, expectedError }) => {
      const mockRes =
        responseType === 'missing-set'
          ? ({ json: jest.fn().mockReturnThis() } as any)
          : responseType === 'missing-json'
          ? ({ set: jest.fn().mockReturnThis() } as any)
          : ({
              set: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            } as any);

      if (expectedError) {
        expect(() =>
          helpers.prepareListResponse(mockRes, data as any[], total, params as any),
        ).toThrow(expectedError);
        return;
      }

      const result = helpers.prepareListResponse(mockRes, data as any[], total, params as any);

      expect(mockRes.set).toHaveBeenCalledWith(expectedHeaders);
      expect(mockRes.json).toHaveBeenCalledWith(data);
      expect(result).toBe(mockRes);
    });
  });
});
