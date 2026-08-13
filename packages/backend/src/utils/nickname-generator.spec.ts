import { NicknameGenerator } from './nickname-generator';

describe('generateNickname', () => {
  it.each<{
    firstName: unknown;
    lastName: unknown;
    maxLen?: number;
    isRandom: boolean;
    expectedError?: typeof TypeError;
  }>([
    {
      firstName: 'Ivan',
      lastName: undefined,
      isRandom: false,
    },
    {
      firstName: undefined,
      lastName: 'Petrova',
      isRandom: false,
    },
    { firstName: 'Иван-123', lastName: 'Петров!', isRandom: false },
    { firstName: '!!!', lastName: '***', isRandom: true },
    { firstName: undefined, lastName: undefined, isRandom: true },
    { firstName: null, lastName: null, isRandom: true },
    { firstName: '', lastName: '', isRandom: true },
    { firstName: '   ', lastName: '   ', isRandom: true },
    {
      firstName: 'ОченьДлинноеИмяПользователя',
      lastName: 'СуперДлиннаяФамилия',
      maxLen: 30,
      isRandom: false,
    },
    {
      firstName: '',
      lastName: 'Катс',
      isRandom: false,
    },
    {
      firstName: 123,
      lastName: 'Petrov',
      isRandom: false,
      expectedError: TypeError,
    },
    {
      firstName: 'Ivan',
      lastName: { value: 'Petrov' },
      isRandom: false,
      expectedError: TypeError,
    },
    {
      firstName: true,
      lastName: 'Petrov',
      isRandom: false,
      expectedError: TypeError,
    },
  ])(
    'generateNickname(firstName: $firstName, lastName: $lastName, isRandom: $isRandom, error: $expectedError)',
    ({ firstName, lastName, maxLen, isRandom, expectedError }) => {
      const run = () => NicknameGenerator.generateNickname(firstName as any, lastName as any);

      if (expectedError) {
        expect(run).toThrow(expectedError);
        return;
      }

      const nickname = run();

      expect(nickname).toBeTruthy();
      expect(nickname).toMatch(/^[A-Za-z0-9]+$/);
      expect(nickname).toMatch(/\d+$/);

      if (maxLen !== undefined) {
        expect(nickname.length).toBeLessThanOrEqual(maxLen);
      }

      if (isRandom) {
        expect(nickname).toMatch(/^[A-Za-z]+[A-Za-z]+\d+$/);
      }
    },
  );
});

describe('generateNickname strategies', () => {
  const callGenerateNickname = (firstName?: unknown, lastName?: unknown) =>
    NicknameGenerator.generateNickname(firstName as any, lastName as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each<{
    title: string;
    firstName?: unknown;
    lastName?: unknown;
    picks: Array<(array: unknown[]) => unknown>;
    expected: string;
  }>([
    {
      title: 'uses strategy #1: prefix + number',
      firstName: 'Ivan',
      lastName: undefined,
      picks: [(array) => array[0]],
      expected: 'Ivan1',
    },
    {
      title: 'uses strategy #2: initials + noun + number',
      firstName: 'Ivan',
      lastName: 'Petrov',
      picks: [(array) => array[1], () => 'Tiger'],
      expected: 'IPTiger1',
    },
    {
      title: 'uses strategy #3: short name + adjective + number',
      firstName: 'Ivan',
      lastName: 'Petrov',
      picks: [(array) => array[2], () => 'Happy'],
      expected: 'IvanHappy1',
    },
    {
      title: 'uses strategy #4: adjective + short name + number',
      firstName: 'Ivan',
      lastName: 'Petrov',
      picks: [(array) => array[3], () => 'Happy'],
      expected: 'HappyIvan1',
    },
    {
      title: 'falls back to random nickname when selected strategy returns null',
      firstName: 'Ivan',
      lastName: undefined,
      picks: [(array) => array[1], () => 'Happy', () => 'Tiger'],
      expected: 'HappyTiger1',
    },
  ])('$title', ({ firstName, lastName, picks, expected }) => {
    const pickQueue = [...picks];
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest
      .spyOn(NicknameGenerator as any, 'getRandomElement')
      .mockImplementation((...args: unknown[]) => {
        const array = args[0] as unknown[];
        const picker = pickQueue.shift();
        return picker ? (picker(array) as any) : (array[0] as any);
      });

    const nickname = callGenerateNickname(firstName, lastName);
    expect(nickname).toBe(expected);
  });
});

describe('generateMultipleLogins', () => {
  test.each<{
    firstName?: unknown;
    lastName?: unknown;
    format: RegExp;
    expectedError?: typeof TypeError;
  }>([
    { firstName: 'Ivan', format: /^[a-z0-9_]+$/ },
    {
      firstName: undefined,
      lastName: 'Petrov',
      format: /^[a-z0-9_]+$/,
    },
    {
      firstName: 'Иван',
      lastName: 'Петров',
      format: /^[a-z0-9_]+$/,
    },
    { firstName: 'I', lastName: 'P', format: /^[a-z0-9_]+$/ },
    {
      firstName: undefined,
      lastName: undefined,
      format: /^[a-z_]+[0-9]*$/,
    },
    { firstName: null, lastName: null, format: /^[a-z_]+[0-9]*$/ },
    { firstName: '', lastName: '', format: /^[a-z_]+[0-9]*$/ },
    {
      firstName: '',
      lastName: 'Petrov',
      format: /^[a-z0-9_]+$/,
    },
    {
      firstName: { value: 'Ivan' },
      lastName: 'Petrov',
      format: /^[a-z0-9_]+$/,
      expectedError: TypeError,
    },
    {
      firstName: 'Ivan',
      lastName: 123,
      format: /^[a-z0-9_]+$/,
      expectedError: TypeError,
    },
  ])(
    'generateMultipleLogins(firstName: $firstName, lastName: $lastName, format: $format, error: $expectedError)',
    ({ firstName, lastName, format, expectedError }) => {
      const run = () => NicknameGenerator.generateMultipleLogins(firstName as any, lastName as any);

      if (expectedError) {
        expect(run).toThrow(expectedError);
        return;
      }

      const logins = run();

      expect(logins).toHaveLength(7);
      expect(new Set(logins).size).toBe(7);
      logins.forEach((login) => {
        expect(login).toMatch(format);
        expect(login.length).toBeGreaterThan(0);
      });
    },
  );
});

describe('generateMultipleLogins strategies', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each<{
    title: string;
    expectedLogin: string;
  }>([
    { title: 'strategy #1: first 3 letters + digit', expectedLogin: 'iva0' },
    { title: 'strategy #2: initials + animal + digit', expectedLogin: 'ip_cat0' },
    { title: 'strategy #3: name prefix + color + digit', expectedLogin: 'iv_red0' },
    { title: 'strategy #4: name prefix + food', expectedLogin: 'iv_pizza' },
    { title: 'strategy #5: initials + magic + digit', expectedLogin: 'ipstar0' },
    { title: 'strategy #6: adjective + last name prefix + digit', expectedLogin: 'cool_pet0' },
    { title: 'strategy #7: mixed letters + animal', expectedLogin: 'iev_cat' },
  ])('$title', ({ expectedLogin }) => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest
      .spyOn(NicknameGenerator as any, 'getRandomElement')
      .mockImplementation((...args: unknown[]) => {
        const array = args[0] as unknown[];
        return array[0] as any;
      });

    const logins = NicknameGenerator.generateMultipleLogins('Ivan', 'Petrov');

    expect(logins).toHaveLength(7);
    expect(new Set(logins).size).toBe(7);
    expect(logins).toContain(expectedLogin);
  });
});

describe('generateRandomLogins', () => {
  const callGenerateRandomLogins = (count: unknown) =>
    (NicknameGenerator as any).generateRandomLogins(count) as string[];

  test.each<{
    count: number;
    expectedLength: number;
  }>([
    { count: -1, expectedLength: 0 },
    { count: 0, expectedLength: 0 },
    { count: 5, expectedLength: 5 },
    { count: undefined, expectedLength: 0 },
    { count: null, expectedLength: 0 },
    { count: NaN, expectedLength: 0 },
  ])(
    'generateRandomLogins(count: $count, expectedLength: $expectedLength)',
    ({ count, expectedLength }) => {
      const logins = callGenerateRandomLogins(count);

      expect(logins.length).toBe(expectedLength);
      expect(new Set(logins).size).toBe(logins.length);

      logins.forEach((login) => {
        expect(login).toMatch(/^[a-z_]+[0-9]*$/);
      });
    },
  );
});

describe('generateRandomLogins strategies', () => {
  const callGenerateRandomLogins = (count: unknown) =>
    (NicknameGenerator as any).generateRandomLogins(count) as string[];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each<{
    title: string;
    expectedLogin: string;
  }>([
    { title: 'strategy #1 animal+digit', expectedLogin: 'tiger0' },
    { title: 'strategy #2 animal_+digit', expectedLogin: 'tiger_0' },
    { title: 'strategy #3 adjective_animal', expectedLogin: 'red_cat' },
    { title: 'strategy #4 short adjective_animal+digit', expectedLogin: 'big_cat0' },
    { title: 'strategy #5 food+digit', expectedLogin: 'pizza0' },
    { title: 'strategy #6 color_food', expectedLogin: 'red_pizza' },
    { title: 'strategy #7 magic+digit', expectedLogin: 'star0' },
  ])('$title', ({ expectedLogin }) => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest
      .spyOn(NicknameGenerator as any, 'getRandomElement')
      .mockImplementation((...args: unknown[]) => {
        const array = args[0] as unknown[];
        return array[0] as any;
      });

    const logins = callGenerateRandomLogins(7);

    expect(logins).toContain(expectedLogin);
  });
});

describe('transliterate', () => {
  const callTransliterate = (value: unknown) =>
    (NicknameGenerator as any).transliterate(value) as string;

  test.each<{
    input: unknown;
    expected?: string;
    expectedError?: typeof TypeError;
  }>([
    { input: 'а', expected: 'a' },
    { input: 'А', expected: 'A' },
    { input: 'ё', expected: 'yo' },
    { input: 'Ё', expected: 'Yo' },
    { input: 'щ', expected: 'sch' },
    { input: 'Щ', expected: 'Sch' },
    { input: 'ь', expected: '' },
    { input: 'Ь', expected: '' },
    { input: '', expected: '' },
    { input: '   ', expected: '   ' },
    { input: undefined, expectedError: TypeError },
    { input: null, expectedError: TypeError },
    { input: 123, expectedError: TypeError },
    { input: true, expectedError: TypeError },
    { input: { value: 'a' }, expectedError: TypeError },
    { input: ['a'], expectedError: TypeError },
  ])(
    'transliterate(input: $input, expected: $expected, error: $expectedError)',
    ({ input, expected, expectedError }) => {
      if (expectedError) {
        expect(() => callTransliterate(input)).toThrow(expectedError);
      } else {
        expect(callTransliterate(input)).toBe(expected);
      }
    },
  );
});

describe('sanitizeName', () => {
  const callSanitize = (value: unknown) => (NicknameGenerator as any).sanitizeName(value) as string;

  test.each<{
    input: unknown;
    expected?: string;
    matcher?: RegExp;
    maxLen?: number;
    expectedError?: typeof TypeError;
  }>([
    { input: 'Ivan123', expected: 'Ivan123' },
    { input: ' Iv an-123! ', expected: 'Ivan123' },
    { input: 'Иван', expected: 'Ivan' },
    {
      input: 'Иван-Петров, Jr.',
      expected: 'IvanPetrovJr',
    },
    { input: '!@#$%^&*()', expected: '' },
    { input: '0123456789', expected: '0123456789' },
    { input: '', expected: '' },
    { input: '   ', expected: '' },
    { input: 'AbCdE', expected: 'AbCdE' },
    {
      input: 'ИванIvan123!!!',
      matcher: /^[A-Za-z0-9]+$/,
    },
    { input: 'ОченьДлинноеСлово', maxLen: 15 },
    { input: undefined, expectedError: TypeError },
    { input: null, expectedError: TypeError },
  ])(
    'sanitizeName(input: $input, expected: $expected, error: $expectedError)',
    ({ input, expected, matcher, maxLen, expectedError }) => {
      if (expectedError) {
        expect(() => callSanitize(input)).toThrow(expectedError);
        return;
      }

      const result = callSanitize(input);

      if (expected !== undefined) {
        expect(result).toBe(expected);
      }
      if (matcher) {
        expect(result).toMatch(matcher);
      }
      if (maxLen !== undefined) {
        expect(result.length).toBeLessThanOrEqual(maxLen);
      }
    },
  );
});

describe('getRandomElement (internal)', () => {
  const callGetRandomElement = <T>(array: unknown) =>
    (NicknameGenerator as any).getRandomElement(array) as T | undefined;

  test.each<{
    array: unknown;
    expected?: unknown;
    expectedError?: typeof TypeError;
  }>([
    { array: [1] },
    { array: [1, 2, 3] },
    { array: ['a', 'b', 'c'] },
    { array: [{ id: 1 }, { id: 2 }] },
    { array: [true, false] },
    { array: [null, undefined, 'x'] },
    { array: [NaN, 0, 1] },
    { array: [Symbol('a'), Symbol('b')] },
    { array: [{ value: 'test' }] },
    {
      array: ['tiger', 'lion', 'bear', 'wolf', 'fox', 'cat', 'dog', 'owl', 'hawk', 'swan'],
    },
    { array: [], expected: undefined },
    { array: undefined, expectedError: TypeError },
    { array: null, expectedError: TypeError },
  ])(
    'getRandomElement(array: $array, expected: $expected, error: $expectedError)',
    ({ array, expected, expectedError }) => {
      if (expectedError) {
        expect(() => callGetRandomElement(array)).toThrow(expectedError);
        return;
      }

      const result = callGetRandomElement(array);
      if (expected !== undefined) {
        expect(result).toBe(expected);
      } else if ((array as any[]).length === 0) {
        expect(result).toBeUndefined();
      } else {
        expect(array as any[]).toContain(result as any);
      }
    },
  );
});
