import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import { join } from 'path';
import * as constants from '../../constants';
import { EProviderTypes, SortDirection, UserRoles } from '../../enums';
import { createSha256Hash } from '../../helpers';

export type TPrisma = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

const setHashedMailOnCreateMiddleware = (params, next) => {
  if (params.action === 'create' && params.model === 'ExternalAccount') {
    const account = params.args.data;
    if (account.type === EProviderTypes.EMAIL) {
      params.args.data.hashed_email = createSha256Hash(account.sub);
    }
  }

  if (
    (params.action === 'update' || params.action === 'create') &&
    params.model === 'User' &&
    params.args.data?.ExternalAccount?.create
  ) {
    const account = params.args.data.ExternalAccount.create;
    if (account.type === EProviderTypes.EMAIL) {
      params.args.data.ExternalAccount.create.hashed_email = createSha256Hash(account.sub);
    }
  }
  return next(params);
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    this.$use(setHashedMailOnCreateMiddleware);

    if (!constants.CLIENT_ID) {
      throw new BadRequestException('CLIENT_ID not specified');
    }

    if (!constants.CLIENT_SECRET) {
      throw new BadRequestException('CLIENT_SECRET not specified');
    }

    const externalAccountImgPath = join(
      __dirname,
      '../../..',
      'public',
      'images',
      'externalAccount',
    );
    if (!fs.existsSync(externalAccountImgPath)) {
      fs.mkdirSync(externalAccountImgPath, { recursive: true });
    }

    await this.$transaction(async (prisma) => {
      // Find the main application; it was created first
      const generalClient = await prisma.client.findFirst({
        orderBy: { created_at: SortDirection.ASC },
      });

      // Determine whether this is the first launch for the main application
      const initFlag = !generalClient;

      // Determine whether the client_id needs to be updated in the database
      const updateFlag = initFlag ? false : generalClient.client_id !== constants.CLIENT_ID;

      //#region General CLIENT
      if (initFlag) {
        await prisma.client.create({
          data: {
            catalog: true,
            widget_colors: { button_color: '#4C6AD4', font_color: '#fff', link_color: '#000' },
            avatar: 'public/default/logo.png',
            name: 'Encvoy ID',
            domain: constants.DOMAIN,
            client_id: constants.CLIENT_ID,
            client_secret: constants.CLIENT_SECRET,
            token_endpoint_auth_method: 'none',
            introspection_endpoint_auth_method: 'none',
            revocation_endpoint_auth_method: 'none',
            grant_types: ['authorization_code', 'refresh_token'],
            redirect_uris: [constants.DOMAIN + '/code', constants.DOMAIN + '/login'],
            post_logout_redirect_uris: [constants.DOMAIN],
          },
        });
      }

      if (updateFlag) {
        await prisma.client.update({
          where: { client_id: generalClient.client_id },
          data: {
            domain: constants.DOMAIN,
            client_id: constants.CLIENT_ID,
            client_secret: constants.CLIENT_SECRET,
            redirect_uris: [constants.DOMAIN + '/code', constants.DOMAIN + '/login'],
            post_logout_redirect_uris: [constants.DOMAIN],
          },
        });
      }
      //#endregion

      //#region PROVIDERS
      if (updateFlag) {
        await prisma.provider.updateMany({
          where: { client_id: generalClient.client_id },
          data: { client_id: constants.CLIENT_ID },
        });
      }
      //#endregion

      //#region CREDENTIALS
      // Find the CREDENTIALS provider
      const credentialsProvider = await prisma.provider.findFirst({
        where: { type: EProviderTypes.CREDENTIALS },
      });

      if (!credentialsProvider) {
        // Create a provider
        await prisma.provider.create({
          data: {
            type: EProviderTypes.CREDENTIALS,
            name: 'Login/Password',
            avatar: 'public/default/credentials.svg',
            is_public: true,
            client_id: constants.CLIENT_ID,
            Provider_relations: { create: { client_id: constants.CLIENT_ID } },
          },
        });
      }
      //#endregion

      //#region ADMIN
      const rootUserDate = new Date();
      rootUserDate.setFullYear(1999);
      rootUserDate.setMonth(1);
      rootUserDate.setDate(15);

      await prisma.user.upsert({
        where: { id: 1 },
        update: {},
        create: {
          nickname: 'project owner',
          birthdate: rootUserDate,
          family_name: 'lastName',
          given_name: 'firstName',
          login: constants.ADMIN_LOGIN,
          hashed_password: await bcrypt.hash(constants.ADMIN_PASSWORD, 10),
          password_updated_at: new Date(),
          email: constants.EMAIL_PROVIDER ? constants.EMAIL_PROVIDER.root_mail : undefined,
          email_verified: !!constants.EMAIL_PROVIDER,
          Role: {
            create: {
              role: UserRoles.OWNER,
              client_id: constants.CLIENT_ID,
            },
          },
          Scopes: {
            create: {
              scopes: '',
              client_id: constants.CLIENT_ID,
            },
          },
          ExternalAccount: {
            create: constants.EMAIL_PROVIDER
              ? {
                  sub: constants.EMAIL_PROVIDER.root_mail,
                  type: EProviderTypes.EMAIL,
                  hashed_email: crypto
                    .createHash('sha256')
                    .update(constants.EMAIL_PROVIDER.root_mail)
                    .digest('hex'),
                  hashed_email_md5: crypto
                    .createHash('md5')
                    .update(constants.EMAIL_PROVIDER.root_mail)
                    .digest('hex'),
                }
              : undefined,
          },
        },
      });
      //#endregion
    });
  }
}
