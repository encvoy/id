import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import fs from 'fs';
import { join } from 'path';
import * as constants from '../../constants';
import { EProviderTypes, SortDirection, UserRoles } from '../../enums';
import { createSha256Hash, generateRandomString } from '../../helpers';
import { requireRuntimeDomain } from '../../runtime-domain';
import { upsertLegacyUserProfileValues } from '../repository/user-profile-write';
import { syncAllGuestsGroups } from './guests-group';

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

const areStringArraysEqual = (actual: string[], expected: string[]): boolean =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    this.$use(setHashedMailOnCreateMiddleware);

    const generalClientSeed = await this.client.findFirst({
      orderBy: {
        created_at: SortDirection.ASC,
      },
      select: {
        client_id: true,
      },
    });

    constants.setClientId(generalClientSeed?.client_id || generateRandomString(22));

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
      let generalClient = await prisma.client.findFirst({
        orderBy: { created_at: SortDirection.ASC },
      });

      // Determine whether this is the first launch for the main application
      const initFlag = !generalClient;

      const normalizedDomain = requireRuntimeDomain(constants.DOMAIN).replace(/\/+$/, '');
      const normalizedGeneralClientDomain = generalClient?.domain.replace(/\/+$/, '');
      const expectedRedirectUris = [normalizedDomain + '/code', normalizedDomain + '/login'];
      const expectedPostLogoutRedirectUris = [normalizedDomain];

      // Determine whether the base application needs to be updated in the database
      const updateFlag = initFlag
        ? false
        : normalizedGeneralClientDomain !== normalizedDomain ||
          !areStringArraysEqual(generalClient.redirect_uris, expectedRedirectUris) ||
          !areStringArraysEqual(
            generalClient.post_logout_redirect_uris,
            expectedPostLogoutRedirectUris,
          );

      //#region General CLIENT
      if (initFlag) {
        generalClient = await prisma.client.create({
          data: {
            catalog: true,
            widget_colors: { button_color: '#4C6AD4', font_color: '#fff', link_color: '#000' },
            avatar: 'public/default/logo.png',
            name: 'ID',
            domain: normalizedDomain,
            client_id: constants.CLIENT_ID,
            client_secret: generateRandomString(87),
            token_endpoint_auth_method: 'none',
            introspection_endpoint_auth_method: 'none',
            revocation_endpoint_auth_method: 'none',
            grant_types: ['authorization_code', 'refresh_token'],
            redirect_uris: expectedRedirectUris,
            post_logout_redirect_uris: expectedPostLogoutRedirectUris,
          },
        });
      }

      if (updateFlag) {
        generalClient = await prisma.client.update({
          where: { client_id: generalClient.client_id },
          data: {
            domain: normalizedDomain,
            redirect_uris: expectedRedirectUris,
            post_logout_redirect_uris: expectedPostLogoutRedirectUris,
          },
        });
      }
      //#endregion

      let directoryFolder = await prisma.folder.findFirst({
        where: {
          client_id: generalClient.client_id,
          name: 'Directory',
          parent_id: null,
        },
      });

      if (!directoryFolder) {
        directoryFolder = await prisma.folder.create({
          data: {
            client_id: generalClient.client_id,
            name: 'Directory',
            description: 'System directory folder',
          },
        });
      }

      if (!generalClient.folder_id) {
        await prisma.client.update({
          where: { client_id: generalClient.client_id },
          data: { folder_id: directoryFolder.id },
        });
      }

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
            name: {
              'ru-RU': 'Логин/пароль',
              'en-US': 'Login/Password',
              'es-ES': 'Inicio de sesión/Contraseña',
              'fr-FR': 'Identifiant/Mot de passe',
              'de-DE': 'Anmeldedaten/Passwort',
              'it-IT': 'Credenziali/Password',
            },
            avatar: 'public/default/credentials.svg',
            is_public: true,
            client_id: constants.CLIENT_ID,
            providerRelations: { create: { client_id: constants.CLIENT_ID } },
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
        where: { id: '1' },
        update: {
          folder_id: directoryFolder.id,
        },
        create: {
          id: '1',
          hashed_password: await bcrypt.hash(constants.ADMIN_PASSWORD, 10),
          password_updated_at: new Date(),
          folder_id: directoryFolder.id,
          org_id: constants.CLIENT_ID,
          roles: {
            create: {
              role: UserRoles.OWNER,
              client_id: constants.CLIENT_ID,
            },
          },
          scopes: {
            create: {
              scopes: '',
              client_id: constants.CLIENT_ID,
            },
          },
        },
      });

      await upsertLegacyUserProfileValues(prisma, '1', {
        nickname: 'project owner',
        birthdate: rootUserDate.toISOString(),
        family_name: 'lastName',
        given_name: 'firstName',
        login: constants.ADMIN_LOGIN,
      });

      if (initFlag) {
        // Create a default admin user with the login "admin" and password "admin"
        await prisma.user.upsert({
          where: { id: '2' },
          update: {},
          create: {
            id: '2',
            hashed_password: await bcrypt.hash('admin', 10),
            password_updated_at: new Date(),
            folder_id: directoryFolder.id,
            roles: {
              create: {
                role: UserRoles.EDITOR,
                client_id: constants.CLIENT_ID,
              },
            },
            scopes: {
              create: {
                scopes: '',
                client_id: constants.CLIENT_ID,
              },
            },
          },
        });

        await upsertLegacyUserProfileValues(prisma, '2', {
          nickname: 'admin',
          birthdate: rootUserDate.toISOString(),
          family_name: 'lastName',
          given_name: 'firstName',
          login: constants.ADMIN_LOGIN !== 'admin' ? 'admin' : 'admin2',
        });

        // Fix old migrations
        await prisma.profileField.updateMany({
          where: { key: 'email' },
          data: {
            editable: true,
            required: false,
            active: true,
            unique: true,
          },
        });
      }
      //#endregion
      await syncAllGuestsGroups(prisma);
    });
  }
}
