import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import crypto from 'crypto';
import { Response } from 'express';
import fs from 'fs';
import path, { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DOMAIN } from './constants';
import { ListInputDto } from './custom.dto';
import { Ei18nCodes, IdentifierType, UserRoles } from './enums';
import { Client } from '@prisma/client';
import { prisma } from './modules';

export const isEmpty = (obj) =>
  [Object, Array].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;

/**
 * Determines the identifier type
 * Ignores leading and trailing spaces
 */
export function getIdentifierType(identifier: string): IdentifierType {
  const ids = identifier.trim();
  if (/^\d+$/.test(ids) && ids.length < 8) {
    return IdentifierType.ID;
  }

  if (isMobilePhone(ids)) {
    return IdentifierType.PhoneNumber;
  }

  if (ids?.includes('@')) {
    return IdentifierType.Email;
  }

  return IdentifierType.Login;
}

/**
 * Prepares an identifier for database lookup
 */
export function prepareIdentifier(identifier: string, type: IdentifierType): string | number {
  const ids = identifier.trim();
  switch (type) {
    case IdentifierType.ID:
      return parseInt(ids, 10);
    case IdentifierType.PhoneNumber:
      const phone = preparePhoneNumber(ids);
      if (!phone) {
        throw new BadRequestException(Ei18nCodes.T3E0029);
      }
      return phone;
    case IdentifierType.Email:
      return ids.toLowerCase();
    // case IdentifierType.Login:
    //   return escapeSpecCharsForPostgreSQL(ids); // Escapes special characters for PostgreSQL
    default:
      return ids;
  }
}

//#region PhoneNumber // Block for working with phone numbers
//#region UniversalPhone — Full support for formats + global numbers

/**
 * Regex for "raw" input — supports:
 * +7 912 345 67 89
 * +7 (912) 345 67 89
 * 8 912 345 67 89
 * 8 (912) 345-67-89
 * +7-912-345-67-89
 * 8-912-345-67-89
 * +4791234567
 * +12025550123
 * и т.д.
 */
export const PHONE_REGEX =
  /^(\+?\d{1,3})?[-.\s]?\(?(\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}$|^(\+?\d{1,3})\d{8,15}$/;

export function isMobilePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace(/\+/g, '');

  if (digitsOnly.length < 9 || digitsOnly.length > 18) return false;

  if (cleaned.startsWith('+')) {
    const match = cleaned.match(/^\+(\d{1,3})(\d{8,15})$/);
    return !!match;
  }

  if (/^[87]/.test(digitsOnly) && digitsOnly.length === 11 && digitsOnly[1] === '9') {
    return true;
  }

  return /^\+\d{9,18}$/.test(cleaned);
}

/**
 * Phone number E.164: 79012345678
 */
export function preparePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/[^\d]/g, '');

  // --- 8XXXXXXXXXX → +7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8') && digits[1] === '9') {
    return '7' + digits.slice(1);
  }

  // --- 9XXXXXXXXX → 79XXXXXXXXX
  if (digits.length === 10 && digits.startsWith('9')) {
    return '7' + digits;
  }

  // --- XXX...
  const intlMatch = digits.match(/^(\d{0,2})(\d{7,14})$/);
  if (intlMatch) {
    return digits;
  }

  return null;
}
//#endregion // End of block for working with phone numbers

export async function getOrganization(client: string | Client): Promise<Client> {
  let organization: Client;
  if (typeof client === 'string') {
    organization = await prisma.client.findUnique({
      where: { client_id: client },
    });
  } else {
    organization = client;
  }

  if (!organization) {
    throw new BadRequestException(`Organization with client_id ${client} not found`);
  }

  if (organization.parent_id) {
    if (organization['parent']) {
      organization = organization['parent'];
    } else {
      organization = await prisma.client.findUnique({
        where: { client_id: organization.parent_id },
      });
    }
    if (!organization) {
      throw new BadRequestException(
        `Parent organization with id ${organization.parent_id} not found`,
      );
    }
  }

  return organization;
}

export const getObjectKeys = <T extends Record<string, unknown>>(object: T): Array<keyof T> =>
  <Array<keyof T>>Object.keys(object);

export const getObjectEntries = <T extends Record<string, never>, K extends keyof T>(
  object: T,
): [keyof T, T[K]][] => Object.entries(object);

export const removeEmptyValues = (obj: Object) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => !!v));

export function errorHandler(message: string, e: any) {
  if (!(e instanceof HttpException)) {
    const error = new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR, { cause: e });

    return Promise.reject(error);
  }
  return Promise.reject(e);
}

/**
 * Generates a random number of the specified length.
 */
export const generateRandomDigits = async (number = 6): Promise<string> =>
  new Promise((resolve, reject) => {
    crypto.randomInt(0, 1000000, (err, result) => {
      if (err) reject(err);
      resolve(result.toString().padStart(number, '0'));
    });
  });

/**
 * Generates a random string of the specified length.
 */
export function generateRandomString(length = 34): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const stringToBoolean = (value?: string) => {
  if (!value) return undefined;
  return !!JSON.parse(String(value).toLowerCase());
};

export const formatDate = (value: string | Date): string => {
  const date = new Date(value);

  return (
    `0${date.getDate()}`.slice(-2) +
    ` ${getMonthByNumber(date.getMonth())} ${date.getFullYear()} г.`
  );
};

export const getMonthByNumber = (month: number): string => {
  switch (month) {
    case 0:
      return 'January';
    case 1:
      return 'February';
    case 2:
      return 'March';
    case 3:
      return 'April';
    case 4:
      return 'May';
    case 5:
      return 'June';
    case 6:
      return 'July';
    case 7:
      return 'August';
    case 8:
      return 'September';
    case 9:
      return 'October';
    case 10:
      return 'November';
    case 11:
      return 'December';
    default:
      return '';
  }
};

export type decodedBase64ImageData = { type?: string; base64?: string; data?: Buffer };

export const decodeBase64Image = (photo?: string): decodedBase64ImageData => {
  let type: string;

  if (!photo) return;
  if (photo.slice(0, 11) === 'iVBORw0KGgo') {
    type = 'image/png';
  } else if (photo.slice(0, 3) === '/9j') {
    type = 'image/jpg';
  } else if (photo.slice(0, 5) === 'UklGR') {
    type = 'image/jpeg';
  } else if (photo.slice(0, 3) === 'Qk0') {
    type = 'image/bmp';
  } else if (photo.slice(0, 4) === 'RIFF') {
    type = 'image/webp';
  } else return;

  return { type, base64: photo, data: new Buffer(photo, 'base64') };
};

export const isFileExists = async (path) =>
  await fs.promises.access(path).then(
    () => true,
    () => false,
  );

/**
 * Deletes an image from the local path.
 * @param paths The path of the image to be deleted.
 */
export async function deleteImageFromLocalPath(...paths: string[]) {
  for (const imagePath of paths) {
    if (!imagePath) continue;
    if (!imagePath.includes('public/images/')) continue;
    const internalPartsPath = imagePath.split('public/images/')[1];
    const fullPath = join(__dirname, '..', 'public', 'images', ...internalPartsPath.split('/'));
    if (fullPath.includes('default')) continue;
    try {
      await fs.promises.unlink(fullPath);
    } catch (e) {
      console.error(`deleteImageFromLocalPath error: `, e);
    }
  }
}

export const saveExternalAccountImageOnAuth = async (
  avatarData: decodedBase64ImageData,
  avatar: string,
) => {
  let savePath = '';
  let imagesAreEqual = true;
  if (avatarData) {
    const imageName = await uploadExternalAccountImage(
      avatarData,
      avatar?.split('externalAccount/')[1],
    );
    if (imageName) {
      imagesAreEqual = false;
      savePath = DOMAIN + '/public/images/externalAccount/' + imageName;
    } else savePath = undefined;
  } else {
    imagesAreEqual = !avatar;
    savePath = null;
  }
  return { savePath, imagesAreEqual };
};

export const saveExternalAccountImageOnBind = async (avatarData: decodedBase64ImageData) => {
  let pathToImage = '';
  if (avatarData) {
    const imageName = await uploadExternalAccountImage(avatarData);
    pathToImage = imageName ? DOMAIN + '/public/images/externalAccount/' + imageName : undefined;
  }
  return pathToImage;
};

export const uploadExternalAccountImage = async (
  imageData: decodedBase64ImageData,
  oldImageName?: string,
) => {
  try {
    const imageTypeRegularExpression = /\/(.*?)$/;
    const imageType = imageData.type.match(imageTypeRegularExpression);
    const imageName = uuidv4() + '.' + imageType[1];
    const filePath = join(__dirname, '..', 'public', 'images', 'externalAccount', imageName);
    const writeImage = async () => await fs.promises.writeFile(filePath, imageData.data, 'base64');

    if (oldImageName) {
      const oldImagePath = join(
        __dirname,
        '..',
        'public',
        'images',
        'externalAccount',
        oldImageName,
      );

      if (!(await isFileExists(oldImagePath))) {
        await writeImage();

        return imageName;
      }
      const oldImageBase64 = await fs.promises.readFile(oldImagePath, { encoding: 'base64' });

      const imagesAreEqual =
        oldImageBase64.length === imageData.base64.length && oldImageBase64 === imageData.base64;
      if (!imagesAreEqual) {
        await writeImage();

        return imageName;
      }
    } else {
      await writeImage();

      return imageName;
    }
  } catch (e) {
    console.error('uploadExternalAccountImage error: ', e);
  }
};

export function convertToRoles(role: string): UserRoles {
  switch (role.toLowerCase()) {
    case 'admin':
      return UserRoles.ADMIN;
    case 'editor':
      return UserRoles.EDITOR;
    case 'owner':
      return UserRoles.OWNER;
    case 'user':
      return UserRoles.USER;
    default:
      return UserRoles.NONE;
  }
}

export const isAdministrator = (role?: string): boolean =>
  role === UserRoles.OWNER || role === UserRoles.ADMIN;

export const isEditor = (role?: string): boolean =>
  role === UserRoles.OWNER || role === UserRoles.EDITOR;

// Works only with primitive values (not objects)
export const arraysAreEqual = (a: any[], b: any[]) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
};

export const isUrl = (url: string) => {
  const pattern =
    /^(?:([a-z0-9+.-]+):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/;
  return pattern.test(url);
};

// escapes backslashes ("\" - escape character) and wildcard characters ("_", "%")
// https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-LIKE
// https://postgrespro.ru/docs/postgresql/9.6/functions-matching#functions-like
export const escapeSpecCharsForPostgreSQL = (value: string): string => {
  return value.replace(/\\/g, '\\\\').replace(/_/g, '\\_').replace(/%/g, '\\%');
};

export const isLoginValid = (value: string) => {
  return (
    /^.{0,71}$/.test(value) && /^.{3,}$/.test(value) && /^[^@]+$/.test(value) && /[^ ]+/.test(value)
  );
};

export const createSha256Hash = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

export const hasClaim = (claims: string, claim: string) => {
  return !!claims
    .trim()
    .split(' ')
    .find((c) => c === claim);
};

export const deleteClaim = (claims: string, claim: string): string => {
  return claims
    .trim()
    .split(' ')
    .filter((c) => c !== claim)
    .join(' ');
};

export const areObjectsEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

export const permuteUnique = (arr) => {
  const result = [];
  const swap = (a, i, j) => ([a[i], a[j]] = [a[j], a[i]]);

  const generate = (k, heapArr) => {
    if (k === 1) {
      const permutationStr = JSON.stringify(heapArr);
      if (!result.includes(permutationStr)) {
        result.push(permutationStr);
      }
      return;
    }
    generate(k - 1, heapArr);
    for (let i = 0; i < k - 1; i++) {
      swap(heapArr, k % 2 ? 0 : i, k - 1);
      generate(k - 1, heapArr);
    }
  };

  generate(arr.length, arr.slice());

  const finalResult = [];
  result.forEach((value) => {
    const parsed = JSON.parse(value);
    finalResult.push(parsed.join(''));
  });

  return [...new Set(finalResult)];
};

export const translit = (word) => {
  let res = '';
  const converter = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ь: '',
    ы: 'y',
    ъ: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  for (const i of word) {
    if (converter[i]) {
      res += converter[i];
    } else {
      res += i;
    }
  }

  return res;
};

export function findDtoEnv<T extends object>(name: string, dto?: new () => T): T | null {
  let result: T | null = null;

  const value = process.env[name];
  if (!value) {
    return result;
  }

  try {
    const obj = JSON.parse(value);
    result = dto ? plainToInstance(dto, obj) : obj;
  } catch (e) {
    throw new BadRequestException(`Incorrect JSON format for variable '${name}': ${e['message']}`);
  }
  if (dto) {
    const err = validateSync(result, { whitelist: true, forbidNonWhitelisted: true });
    if (err.length) {
      const errorMessages = err.map((e) => Object.values(e.constraints)[0]).join('\n');
      throw new BadRequestException(`Invalid format for variable '${name}':\n${errorMessages}`);
    }
  }

  return result;
}

export function getDtoEnv<T extends object>(name: string, dto: new () => T): T | undefined {
  const result = findDtoEnv<T>(name, dto);
  if (!result) throw new BadRequestException(`Variable '${name}' is not defined`);

  return result;
}

/**
 * Validates the parameters according to the DTO schema
 */
export function validateDto<T extends object>(dto: T, schema: new () => T): void {
  // Create an instance of the schema and copy data from dto
  const dtoInstance = Object.assign(new schema(), dto);

  const err = validateSync(dtoInstance, { whitelist: true, forbidNonWhitelisted: true });
  if (err.length) {
    const errorMessages = err.map((e) => Object.values(e.constraints)[0]).join('\n');
    throw new BadRequestException(errorMessages);
  }
}

/**
 * Prepares a response to a list request
 * Includes information about the number of items in the list in the response header
 */
export function prepareListResponse(
  res: Response,
  data: any[],
  totalCount: number,
  params: ListInputDto,
) {
  const currentOffset = params.offset || 0;
  const nextOffset = currentOffset + (params.limit || 10);

  res.set({
    'X-Total-Count': totalCount,
    'X-Per-Page': params.limit || 10,
    'X-Current-Offset': currentOffset,
    'X-Next-Offset': nextOffset,
  });

  return res.json(data);
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return email; // If the local part is too short, do not mask
  }
  const maskedLocalPart = localPart[0] + '***' + localPart[localPart.length - 1];
  return `${maskedLocalPart}@${domain}`;
}

export async function loadModules(
  pathFolder: string,
  moduleHandler: (module: any) => Promise<void>,
) {
  // If path is not specified, exit
  if (!pathFolder) return;

  // If path is not a folder or does not exist, exit
  if (!fs.existsSync(pathFolder) || !fs.lstatSync(pathFolder).isDirectory()) {
    console.warn(`Folder ${pathFolder} not found`);
    return;
  }

  // Iterate over all folders in the specified directory
  const files = fs.readdirSync(pathFolder);
  for (const file of files) {
    // If not a folder, skip
    if (!fs.lstatSync(path.join(pathFolder, file)).isDirectory()) {
      continue;
    }

    // Check that the folder contains an index file
    const indexPathJS = path.join(pathFolder, file, 'index.js');
    const indexPathTS = path.join(pathFolder, file, 'index.ts');
    if (!fs.existsSync(indexPathJS) && !fs.existsSync(indexPathTS)) {
      console.warn(`Index file not found in folder ${file}`);
      continue;
    }

    try {
      const module = await import(path.join(pathFolder, file));
      await moduleHandler(module);
    } catch (error) {
      console.error(`Error loading providers from ${file}:`, error);
    }
  }
}
