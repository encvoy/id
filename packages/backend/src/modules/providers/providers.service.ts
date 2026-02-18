import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { CLIENT_ID, LIST_PROVIDERS_AUTH, PROVIDER_TYPE_CREDENTIALS } from '../../constants';
import {
  EGetProviderAction,
  Ei18nCodes,
  EProviderGroups,
  SortDirection,
  UserRoles,
} from '../../enums';
import { deleteImageFromLocalPath, isEditor } from '../../helpers';
import { prisma } from '../prisma';
import { listProfileFields } from '../settings/settings.dto';
import { SettingsService } from '../settings/settings.service';
import { ProviderFactory } from './factory.service';
import {
  BaseCreateProviderDto,
  BaseUpdateProviderDto,
  BindProviderDto,
  AllProvidersDto,
  ListProvidersDto,
  UpdateListProvidersDto,
} from './providers.dto';

@Injectable()
export class ProviderService {
  private credentials_provider_id: number;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly providerFactory: ProviderFactory,
  ) {}

  /**
   * Getting the CREDENTIALS provider ID
   * Request data is cached to reduce the number of database queries
   */
  public async getCredentialsProviderId(): Promise<number> {
    if (this.credentials_provider_id) {
      return this.credentials_provider_id;
    }

    const provider = await prisma.provider.findFirst({
      where: { type: 'CREDENTIALS' },
      select: { id: true },
    });

    if (!provider) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0030, { cause: 'CREDENTIALS' });
    }
    this.credentials_provider_id = provider.id;
    return this.credentials_provider_id;
  }

  private async checkMapping(mapping: string) {
    if (!mapping) {
      return;
    }

    mapping = mapping.trim();

    const profileFieldKeys = listProfileFields.map((field) => field.field);
    const customFieldKeys = (await this.settingsService.getCustomFields()).map(
      (field) => field.field,
    );

    // List of mapping errors
    const mappingErrors: string[] = [];

    for (const item of mapping.split(',')) {
      const mappingKey = item.split(':')[0].trim();

      if (!mappingKey) {
        continue;
      }

      const mappingKeyIsValid =
        profileFieldKeys.includes(mappingKey) || customFieldKeys.includes(mappingKey);
      if (!mappingKeyIsValid) {
        mappingErrors.push(mappingKey);
      }
    }

    if (mappingErrors.length) {
      throw new BadRequestException(`Field(s) not found: ${mappingErrors.join(', ')}`);
    }
  }

  /**
   * Creating a provider
   */
  public async create(client_id: string, user_id: string, params: BaseCreateProviderDto) {
    const providerService = this.providerFactory.getProviderService(params.type);

    // Remove the trailing slash from issuer
    if ('issuer' in params && typeof params.issuer === 'string') {
      params.issuer = params['issuer'].replace(/\/$/, '');
    }

    const client = await prisma.client.findUnique({
      where: { client_id },
    });

    if (params.is_public === true && client.parent_id) {
      throw new BadRequestException(Ei18nCodes.T3E0066);
    }

    const updatedParams = await providerService.onCreate(params, client_id, user_id);

    // Check the mapping
    if (
      updatedParams.params &&
      typeof updatedParams.params === 'object' &&
      'mapping' in updatedParams.params &&
      typeof updatedParams.params.mapping === 'string'
    ) {
      await this.checkMapping(updatedParams.params.mapping);
    }

    // Create a provider
    return prisma.provider.create({
      data: {
        ...updatedParams,
        avatar: providerService.defaultUrlAvatar,
      },
    });
  }

  async getList(params: ListProvidersDto, client_id: string, role: UserRoles) {
    const all = await this.getAll(params, client_id, role);
    const big =
      all.filter((p) => p.groupe === EProviderGroups.BIG).sort((a, b) => a.index - b.index) || [];
    const small =
      all
        .filter((p) => p.groupe === EProviderGroups.SMALL || !p.groupe)
        .sort((a, b) => a.index - b.index) || [];
    const off = all.filter((p) => !p.is_active).sort((a, b) => a.name.localeCompare(b.name)) || [];
    return { big, small, off };
  }

  async updateList(params: UpdateListProvidersDto, client_id: string) {
    const bigArray = params.big.map((id, index) => ({ id, index, groupe: EProviderGroups.BIG }));
    const smallArray = params.small.map((id, index) => ({
      id,
      index,
      groupe: EProviderGroups.SMALL,
    }));
    const updates = [...bigArray, ...smallArray];

    await prisma.$transaction(
      updates.map(({ id, index, groupe }) =>
        prisma.provider_relations.updateMany({
          where: { provider_id: id, client_id },
          data: { groupe, index },
        }),
      ),
    );
  }

  async getAll(params: AllProvidersDto, client_id: string, role: UserRoles) {
    const client = await prisma.client.findUnique({
      where: { client_id },
    });

    const where: Prisma.ProviderWhereInput = {
      type: { in: params.types || undefined },
      OR: [
        { Provider_relations: { some: { client_id } } },
        { client_id },
        { client_id: CLIENT_ID, is_public: true },
      ],
    };

    if (client.parent_id) {
      where.OR.push({ client_id: client.parent_id, is_public: true });
    }

    const [all, relations] = await Promise.all([
      prisma.provider.findMany({
        where,
        orderBy: { id: SortDirection.ASC },
      }),
      prisma.provider_relations.findMany({
        where: { client_id },
        orderBy: { id: SortDirection.ASC },
      }),
    ]);

    const credentialsParams = [
      'admin_login',
      'admin_password',
      'password',
      'certificate',
      'secret',
      // 'external_client_id',
      'external_client_secret',
      'certificate',
      'license_id',
      'root_mail',
      'mail_hostname',
      'mail_port',
      'mail_password',
      'mail_code_ttl_sec',
    ];

    let providers = all.reduce(
      (acc: (Provider & { is_active: boolean; groupe: string; index: number })[], provider) => {
        if (role === UserRoles.NONE) {
          const publicData = [
            'avatar',
            'description',
            'disable_password_reset',
            'id',
            'name',
            'type',
            'params',
            'is_public',
          ];
          Object.keys(provider).forEach((key) => {
            if (!publicData.includes(key)) {
              delete provider[key];
            }
          });

          if (provider.params) {
            const publicParams = [
              'params',
              'show_provider_avatar',
              'provider_title',
              'provider_colors',
            ];
            Object.keys(provider.params).forEach((key) => {
              if (!publicParams.includes(key)) {
                if (provider.type !== 'MTLS') {
                  delete provider.params[key];
                }
              }
            });
          }
        } else if (
          (!isEditor(role) ||
            (isEditor(role) &&
              provider?.params &&
              client_id !== CLIENT_ID &&
              provider.client_id === CLIENT_ID)) &&
          provider?.params
        ) {
          credentialsParams.forEach((param) => {
            delete provider.params?.[param];
          });
        }

        const relation = relations.find((r) => r.provider_id === provider.id);

        acc.push({
          ...provider,
          is_active: !!relation,
          groupe: relation && provider.type !== PROVIDER_TYPE_CREDENTIALS ? relation.groupe : '',
          index: relation ? relation.index : 0,
        });
        return acc;
      },
      [],
    );

    if (params.only_active) providers = providers.filter((provider) => provider.is_active);
    if (params.is_public) {
      providers = providers.filter((provider) => provider.is_public);
    }

    if (params.action && params.action === EGetProviderAction.auth) {
      providers = providers.filter((p) => LIST_PROVIDERS_AUTH.includes(p.type));
    }

    return providers;
  }

  async activate(params: BindProviderDto, client_id: string) {
    const providers = await prisma.provider.findMany({
      where: {
        OR: [
          { id: { in: params.providers }, client_id },
          { id: { in: params.providers }, is_public: true },
        ],
        Provider_relations: { none: { client_id } },
      },
    });

    if (!providers.length) {
      return;
    }

    for (const provider of providers) {
      if (provider.type === PROVIDER_TYPE_CREDENTIALS) {
        continue;
      }
      const providerService = this.providerFactory.getProviderService(provider.type);
      await providerService.onActivate(provider);
    }

    await prisma.provider_relations.createMany({
      data: providers.map((provider) => {
        if (provider.type === PROVIDER_TYPE_CREDENTIALS) {
          return { provider_id: provider.id, client_id, groupe: '' };
        }
        return { provider_id: provider.id, client_id };
      }),
    });
  }

  async deactivate(params: BindProviderDto, client_id: string) {
    // Get the Login/Password provider ID
    const credentials_provider_id = await this.getCredentialsProviderId();

    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
    });

    // The OWNER of the personal account should always be able to log in via Login/Password
    if (params.providers.includes(credentials_provider_id) && !client.parent_id)
      throw new BadRequestException(Ei18nCodes.T3E0067);

    // Remove all relationships
    await prisma.provider_relations.deleteMany({
      where: {
        provider_id: { in: params.providers },
        client_id,
      },
    });
  }

  async delete(provider_id: string, client_id: string) {
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(provider_id, 10), client_id },
    });
    if (!provider) {
      return;
    }

    if (provider.type === PROVIDER_TYPE_CREDENTIALS) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    await deleteImageFromLocalPath(provider.avatar);

    await prisma.provider.delete({
      where: { id: parseInt(provider_id, 10), client_id },
    });

    const clients = await prisma.client.findMany({
      where: {
        required_providers_ids: {
          has: provider_id,
        },
      },
    });

    await prisma.$transaction(
      clients.map((client) =>
        prisma.client.update({
          where: { client_id: client.client_id },
          data: {
            required_providers_ids: client.required_providers_ids.filter(
              (id) => id !== provider_id,
            ),
          },
        }),
      ),
    );

    // Double-check; if there are no providers left in the application, then enable Login/Password
    const allProviders = await prisma.provider_relations.findMany({
      where: { client_id },
    });

    if (!allProviders.length) {
      await prisma.provider_relations.create({
        data: {
          provider_id: await this.getCredentialsProviderId(),
          client_id,
        },
      });
    }
  }

  /**
   * Updating a provider
   */
  async update(
    provider_id: number,
    client_id: string,
    user_id: string,
    params: BaseUpdateProviderDto,
  ) {
    const provider = await prisma.provider.findFirst({
      where: { id: provider_id, client_id, type: params.type },
    });
    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const providerService = this.providerFactory.getProviderService(params.type);

    // Remove the trailing slash from issuer
    if ('issuer' in params && typeof params.issuer === 'string') {
      params.issuer = params['issuer'].replace(/\/$/, '');
    }

    const client = await prisma.client.findUnique({
      where: { client_id },
    });

    if (params.is_public === true && client.parent_id) {
      throw new BadRequestException(Ei18nCodes.T3E0066);
    }

    const updatedParams = await providerService.onUpdate(params, provider, client_id, user_id);
    delete updatedParams['groupe'];
    delete updatedParams['index'];

    // Check the mapping
    if (
      updatedParams.params &&
      typeof updatedParams.params === 'object' &&
      'mapping' in updatedParams.params &&
      typeof updatedParams.params.mapping === 'string'
    ) {
      await this.checkMapping(updatedParams.params.mapping);
    }

    const { params: restDto, ...mainParams } = updatedParams;

    await prisma.provider.update({
      where: { id: provider_id },
      data: {
        ...mainParams,
        params: {
          ...(provider.params as Record<string, JsonValue>),
          ...(restDto as Record<string, JsonValue>),
        },
      },
    });

    if (params.is_public === false) {
      await prisma.provider_relations.deleteMany({
        where: {
          provider_id,
          client_id: { not: client_id },
        },
      });
    }
  }

  /**
   * Updating an avatar
   */
  async updateAvatar(provider_id: number, client_id: string, avatar: string | null) {
    const provider = await prisma.provider.findUnique({ where: { id: provider_id, client_id } });
    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }
    if (provider.avatar !== avatar) {
      await deleteImageFromLocalPath(provider.avatar);
    }

    if (!avatar) {
      const providerService = this.providerFactory.getProviderService(provider.type);
      avatar = providerService.defaultUrlAvatar;
    }

    await prisma.provider.update({
      where: { id: provider_id },
      data: {
        avatar,
      },
    });
  }
}
