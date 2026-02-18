import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Client, Prisma, User } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ListInputDto } from 'src/custom.dto';
import { CLIENT_ID, DOMAIN, PROVIDER_TYPE_CREDENTIALS } from '../../constants';
import { Ei18nCodes, SortDirection, UserRoles } from '../../enums';
import { convertToRoles, deleteImageFromLocalPath, generateRandomString } from '../../helpers';
import { prisma } from '../prisma/prisma.client';
import { RedisAdapter } from '../redis/redis.adapter';
import { RoleRepository } from '../repository';
import * as dto from './clients.dto';

export const getUsersSearchParams = (
  search_string: string | undefined,
  search_filter: string[] | undefined,
): any => {
  const searchStringInt = parseInt(search_string, 10);
  // Check that a string is an integer and within the int4 range
  // Necessary for searching in Prisma by id
  const isInt4Safe =
    Number.isInteger(searchStringInt) &&
    searchStringInt <= 2147483647 &&
    searchStringInt >= -2147483648;
  const searchCriteria = search_string?.replace(/\D/g, '');
  const hasInvalidCharacters = /[^0-9\s\+\-\(\)]/.test(search_string);

  const phoneNumberFilter =
    searchCriteria && !hasInvalidCharacters
      ? { contains: searchCriteria, mode: 'insensitive' }
      : undefined;

  if (!search_filter || search_filter?.includes('all') || !search_filter?.length) {
    return search_string
      ? {
          OR: [
            { family_name: { contains: search_string, mode: 'insensitive' } },
            { given_name: { contains: search_string, mode: 'insensitive' } },
            { nickname: { contains: search_string, mode: 'insensitive' } },
            { email: { contains: search_string, mode: 'insensitive' } },
            { login: { contains: search_string, mode: 'insensitive' } },
            { phone_number: phoneNumberFilter },
            ...(isInt4Safe ? [{ id: searchStringInt }] : []),
          ],
        }
      : {};
  }

  return {
    OR: search_filter.map((field) => {
      if (field === 'id') return { id: isInt4Safe ? searchStringInt : undefined };
      if (field === 'phone_number') return { phone_number: phoneNumberFilter };
      return { [field]: { contains: search_string, mode: 'insensitive' } };
    }),
  };
};

const CLIENT_FIELDS_NOT_EDITABLE = [
  'redirect_uris',
  'post_logout_redirect_uris',
  'client_id',
  'client_secret',
  'request_uris',
  'introspection_endpoint_auth_method',
  'token_endpoint_auth_method',
  'revocation_endpoint_auth_method',
  'require_signed_request_object',
  'id_token_signed_response_alg',
  'require_auth_time',
  'response_types',
  'subject_type',
  'subject_types_supported',
];

@Injectable()
export class ClientService {
  constructor(private readonly redis: RedisAdapter, private readonly roleRepo: RoleRepository) {}

  public async create(user_id: string, params: dto.CreateClientDto) {
    const redirectUrisOrigins = params.redirect_uris?.map((uri) => {
      return new URL(uri).origin;
    });

    const provider = await prisma.provider.findFirst({
      where: { type: 'CREDENTIALS' },
      select: { id: true },
    });

    if (!provider) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0030, { cause: 'CREDENTIALS' });
    }

    let type: Prisma.ClientTypeCreateNestedOneWithoutClientInput | undefined;
    if (params.type_id) {
      const clientType = await prisma.clientType.findUnique({
        where: { id: params.type_id },
      });

      if (clientType) {
        type = {
          connect: {
            id: params.type_id,
          },
        };
      }
    }

    const parent = await prisma.role.findFirst({
      where: {
        user_id: parseInt(user_id, 10),
        role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
        client: { parent: null },
      },
      select: { client_id: true },
    });

    if (!parent) throw new InternalServerErrorException(Ei18nCodes.T3E0071);

    const data: Prisma.ClientCreateInput = {
      client_id: generateRandomString(22),
      client_secret: generateRandomString(87),

      name: params.name,
      domain: params.domain,

      parent: {
        connect: {
          client_id: parent.client_id,
        },
      },

      description: params.description,
      response_types: params.response_types,
      request_uris: params.request_uris,
      token_endpoint_auth_method: params.token_endpoint_auth_method,
      introspection_endpoint_auth_method: params.introspection_endpoint_auth_method,
      revocation_endpoint_auth_method: params.revocation_endpoint_auth_method,
      id_token_signed_response_alg: params.id_token_signed_response_alg,
      subject_type: params.subject_type,
      catalog: params.catalog,
      authorize_only_admins: params.authorize_only_admins,
      authorize_only_employees: params.authorize_only_employees,

      redirect_uris: params.redirect_uris,
      grant_types: params.grant_types || ['authorization_code', 'refresh_token'],
      post_logout_redirect_uris: params.post_logout_redirect_uris?.length
        ? params.post_logout_redirect_uris
        : redirectUrisOrigins,
      require_auth_time: params.require_auth_time,
      require_signed_request_object: params.require_signed_request_object,

      widget_colors: {
        button_color: '#4C6AD4',
        font_color: '#fff',
        link_color: '#000',
      },
      Role: {
        create: {
          user_id: parseInt(user_id, 10),
          role: UserRoles.OWNER,
        },
      },
      Provider_relations: {
        create: {
          provider_id: provider.id,
        },
      },
      type,
    };

    const client = await prisma.client.create({ data });
    this.updateCorsToOtherServices('auth');
    this.updateCorsToOtherServices('oidc');

    return {
      client_id: client.client_id,
      client_secret: client.client_secret,
    };
  }

  async getClientsByUserId(
    user_id: string,
    {
      search_string,
      sort_by,
      sort_direction,
      number_of_records,
      last_record_id,
      number_of_skip,
    }: dto.GetClientsByUserIdDto,
  ) {
    try {
      let firstElement: Pick<Client, 'client_id'>;
      const idInt = parseInt(user_id, 10);

      if (number_of_skip) {
        const role = await prisma.role.findFirst({
          take: 1,
          skip: parseInt(number_of_skip, 10),
          where: {
            user_id: idInt,
            client: search_string
              ? {
                  OR: [
                    { client_id: { contains: search_string, mode: 'insensitive' } },
                    { name: { contains: search_string, mode: 'insensitive' } },
                    { domain: { contains: search_string, mode: 'insensitive' } },
                  ],
                }
              : undefined,
            role: { in: [UserRoles.EDITOR, UserRoles.OWNER] },
          },
          select: {
            client: {
              select: {
                client_id: true,
              },
            },
          },

          orderBy: { client: { [sort_by]: sort_direction } },
        });

        if (!role) return [];

        firstElement = role.client;
      }

      const clients = await prisma.role.findMany({
        take: parseInt(number_of_records, 10) || undefined,
        skip: last_record_id ? 1 : undefined,
        cursor:
          firstElement?.client_id || last_record_id
            ? {
                user_id_client_id: {
                  user_id: idInt,
                  client_id: last_record_id || firstElement?.client_id,
                },
              }
            : undefined,
        where: {
          user_id: idInt,
          client: search_string
            ? {
                OR: [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  { name: { contains: search_string, mode: 'insensitive' } },
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ],
              }
            : undefined,
          role: { in: [UserRoles.EDITOR, UserRoles.OWNER] },
        },
        select: {
          role: true,
          client: true,
        },
        orderBy: { client: { [sort_by]: sort_direction } },
      });
      return clients.reduce((acc, item) => {
        acc.push(item);
        return acc;
      }, []);
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
        cause: e,
      });
    }
  }

  /**
   * Getting a list of apps according to filters
   */
  public async list(params: ListInputDto, user_id: string, role: UserRoles) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        Role:
          // If the role is owner or administrator, we don't filter by role, as they have access to all applications
          role === UserRoles.OWNER || role === UserRoles.EDITOR
            ? undefined
            : // otherwise, we filter by role
              {
                some: {
                  user_id: parseInt(user_id, 10),
                  client_id: { not: CLIENT_ID },
                  role: { in: [UserRoles.OWNER, UserRoles.EDITOR, UserRoles.ADMIN] },
                },
              },
        OR: [
          { name: { contains: search || '', mode: 'insensitive' } },
          { description: { contains: search || '', mode: 'insensitive' } },
          { domain: { contains: search || '', mode: 'insensitive' } },
        ],
      },
      select: {
        client_id: true,
        name: true,
        catalog: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
        parent: {
          select: {
            avatar: true,
            name: true,
          },
        },
        Provider_relations: {
          select: {
            provider: {
              select: {
                id: true,
                type: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            Role: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany(findParams),
      prisma.client.count({ where: findParams.where }),
    ]);

    return { clients, totalCount };
  }

  /**
   * Getting a list of public apps according to filters
   */
  public async catalog(params: ListInputDto, user_id: string) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        catalog: true,
        parent_id: { not: null },
        OR: [
          { name: { contains: search || '', mode: 'insensitive' } },
          { description: { contains: search || '', mode: 'insensitive' } },
        ],
      },
      select: {
        client_id: true,
        name: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
        favorite_clients: {
          where: {
            user_id: parseInt(user_id, 10),
          },
          select: {
            id: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany(findParams),
      prisma.client.count({ where: findParams.where }),
    ]);

    return {
      clients: clients.map((client) => ({
        ...client,
        favorite: client['favorite_clients'].length > 0,
      })),
      totalCount,
    };
  }

  /**
   * Getting an app by client_id
   */
  public async getById(client_id: string) {
    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
      include: {
        type: true,
        parent: {
          select: {
            avatar: true,
            name: true,
          },
        },
        rules: {
          select: {
            rule: true,
          },
        },
      },
    });

    return {
      ...client,
      rules: client?.rules?.map((r) => r.rule) ?? [],
    };
  }

  public async getByIdShort(client_id: string) {
    return prisma.client.findUnique({
      where: {
        client_id,
      },
      select: {
        client_id: true,
        name: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
      },
    });
  }

  async getAllClients({
    search_string,
    sort_by,
    sort_direction,
    number_of_records,
    last_record_id,
    number_of_skip,
  }: dto.GetAllClientsDto) {
    try {
      let firstElement: Pick<Client, 'client_id'>;

      if (number_of_skip) {
        firstElement = await prisma.client.findFirst({
          skip: parseInt(number_of_skip, 10),
          where: search_string
            ? {
                OR: [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  { name: { contains: search_string, mode: 'insensitive' } },
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ],
              }
            : undefined,
          orderBy: [{ [sort_by]: sort_direction }, { client_id: SortDirection.ASC }],
        });
      }

      const clients = await prisma.client.findMany({
        take: parseInt(number_of_records, 10) || undefined,
        skip: last_record_id ? 1 : undefined,
        cursor:
          firstElement?.client_id || last_record_id
            ? {
                client_id: last_record_id || firstElement?.client_id,
              }
            : undefined,
        where: search_string
          ? {
              OR: [
                { client_id: { contains: search_string, mode: 'insensitive' } },
                { name: { contains: search_string, mode: 'insensitive' } },
                { domain: { contains: search_string, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: [{ [sort_by]: sort_direction }, { client_id: SortDirection.ASC }],
      });
      return clients.map((client) => ({ client, role: UserRoles.OWNER }));
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async getScopesByClientId(client_id: string, user_id: string) {
    return prisma.scopes.findUnique({
      where: {
        user_id_client_id: { user_id: parseInt(user_id, 10), client_id },
      },
      select: {
        scopes: true,
        created_at: true,
      },
    });
  }

  async getClientByScope(user_id, client_id) {
    const idInt = parseInt(user_id, 10);

    const data = await prisma.scopes.findUnique({
      where: {
        user_id_client_id: {
          user_id: idInt,
          client_id,
        },
      },
      select: {
        client: {
          select: {
            name: true,
            avatar: true,
            client_id: true,
            description: true,
            domain: true,
            created_at: true,
            type: true,
          },
        },
      },
    });

    return data;
  }

  async getClientsByScope(
    user_id,
    {
      search_string,
      sort_by,
      sort_direction,
      number_of_records,
      last_record_id,
    }: dto.GetClientsByScopeDto,
  ) {
    try {
      let firstElement: Pick<Client, 'client_id'>;
      const idInt = parseInt(user_id, 10);

      const data = await prisma.scopes.findMany({
        take: parseInt(number_of_records, 10) || undefined,
        skip: last_record_id ? 1 : undefined,
        cursor:
          firstElement?.client_id || last_record_id
            ? {
                user_id_client_id: {
                  user_id: idInt,
                  client_id: last_record_id || firstElement?.client_id,
                },
              }
            : undefined,
        where: {
          user_id: idInt,
          client: {
            AND: {
              NOT: { client_id: idInt === 1 ? undefined : CLIENT_ID },
              OR: search_string
                ? [
                    { client_id: { contains: search_string, mode: 'insensitive' } },
                    { name: { contains: search_string, mode: 'insensitive' } },
                    { domain: { contains: search_string, mode: 'insensitive' } },
                  ]
                : undefined,
            },
          },
        },
        select: {
          client: {
            select: {
              name: true,
              avatar: true,
              client_id: true,
              description: true,
              domain: true,
              created_at: true,
              type: true,
            },
          },
        },
        orderBy: { client: { [sort_by]: sort_direction } },
      });

      return data;
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async revokeScopes(user_id: string, client_id: string) {
    try {
      await this.redis.revokeGrants(user_id, client_id);

      return await prisma.scopes.delete({
        where: {
          user_id_client_id: {
            user_id: parseInt(user_id, 10),
            client_id,
          },
        },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
        cause: e,
      });
    }
  }

  async getAppAdmins(client_id: string) {
    try {
      return await prisma.role.findMany({
        where: { client_id, role: UserRoles.EDITOR },
        select: { user: true },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async getAllAppUsers(client_id: string) {
    try {
      return await prisma.role.findMany({
        where: { client_id, user: { deleted: null } },
        select: { user: true },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async listUsers(params: ListInputDto, client_id: string) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    const searchStringInt = parseInt(search, 10);
    const isInt4Safe =
      Number.isInteger(searchStringInt) &&
      searchStringInt <= 2147483647 &&
      searchStringInt >= -2147483648;

    const searchCriteria = search?.replace(/\D/g, '');
    const hasInvalidCharacters = /[^0-9\s\+\-\(\)]/.test(search);

    const findParams: Prisma.RoleFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        client_id,
        user: {
          OR: search
            ? [
                { id: isInt4Safe ? searchStringInt : undefined },
                { family_name: { contains: search, mode: 'insensitive' } },
                { given_name: { contains: search, mode: 'insensitive' } },
                { nickname: { contains: search, mode: 'insensitive' } },
                { login: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                {
                  phone_number:
                    searchCriteria && !hasInvalidCharacters
                      ? { contains: searchCriteria }
                      : undefined,
                },
              ]
            : undefined,
        },
      },
      select: {
        user: {
          select: {
            // Profile data
            family_name: true,
            given_name: true,
            nickname: true,
            picture: true,

            // Technical data
            id: true,
            blocked: true,
            deleted: true,
          },
        },
        role: true,
      },
      take: limit,
      skip: offset,
      orderBy: { user: { [sortBy]: sortDirection } },
    };

    const [items, totalCount] = await Promise.all([
      prisma.role.findMany(findParams),
      prisma.role.count({ where: findParams.where }),
    ]);

    return { items, totalCount };
  }

  async getUserById(userId: string, user_id: string, client_id: string) {
    // Determine the role of the requesting user within the system
    const role = await this.roleRepo.findRoleInApp(userId, CLIENT_ID);

    const data = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          client_id,
          user_id: parseInt(user_id, 10),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            birthdate: true,
            family_name: true,
            given_name: true,
            nickname: true,
            login: true,
            phone_number: true,
            picture: true,
            public_profile_claims_oauth: true,
            public_profile_claims_gravatar: true,
            blocked: true,
            deleted: true,
            custom_fields: true,
            password_updated_at: true,
          },
        },
      },
    });

    // If the user is not an administrator or owner, we return only the fields that are in public_profile_claims_oauth
    if (role !== UserRoles.OWNER && role !== UserRoles.EDITOR) {
      const filteredUser = this.filterPublicFields(
        data.user,
        data.user.public_profile_claims_oauth.trim().split(' '),
      );

      return {
        user: filteredUser,
        role: data.role,
      };
    }

    return { user: data.user, role: data.role };
  }

  private filterPublicFields(data: object, publicFields: string[]): object {
    // If data is not an object or null, we return it as is
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // Filter the object's fields
    const filteredEntries = Object.entries(data)
      .filter(([key, value]) => {
        // If the value is an object, we filter it recursively
        if (typeof value === 'object' && value !== null) {
          const filteredNestedObject = this.filterPublicFields(value, publicFields);

          // If the nested object is not empty, we keep it
          return Object.keys(filteredNestedObject).length > 0;
        }

        // We keep the field if it is in publicFields
        return publicFields.find((item) => item === key);
      })
      .map(([key, value]) => {
        // If the value is an object, we return the filtered object
        if (typeof value === 'object' && value !== null) {
          return [key, this.filterPublicFields(value, publicFields)];
        }

        // Otherwise, we return the field as is
        return [key, value];
      });

    // Convert the filtered entries back to an object
    return Object.fromEntries(filteredEntries);
  }

  /**
   * Getting app users
   */
  async getUsers(
    {
      search_string,
      sort_by,
      sort_direction,
      number_of_records,
      last_record_id,
      number_of_skip,
      search_param_user_id,
      search_filter,
    }: dto.GetUsersDto,
    admin_role: string,
    admin_id: string,
    client_id: string,
  ) {
    let firstElement: Pick<User, 'id'>;
    const user_id = search_param_user_id ? parseInt(search_param_user_id, 10) : undefined;
    const splittedSearchFilter = search_filter?.split(',');

    const getOrderParams = ():
      | [
          {
            role: SortDirection;
          },
          { user_id: SortDirection.ASC },
        ]
      | [{ user: { nickname: SortDirection } }, { user_id: SortDirection.ASC }]
      | [
          {
            user: {
              blocked: SortDirection;
            };
          },
          {
            user: {
              deleted: SortDirection;
            };
          },
          { user_id: SortDirection.ASC },
        ] => {
      switch (sort_by) {
        case 'role':
          return [{ role: sort_direction }, { user_id: SortDirection.ASC }];
        case 'nickname':
          return [
            {
              user: {
                nickname: sort_direction,
              },
            },
            { user_id: SortDirection.ASC },
          ];
        case 'status':
          return [
            {
              user: {
                blocked:
                  sort_direction === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
              },
            },
            {
              user: {
                deleted: sort_direction,
              },
            },
            { user_id: SortDirection.ASC },
          ];
        default:
          return undefined;
      }
    };

    const orderParams = getOrderParams();

    if (number_of_skip) {
      const role = await prisma.role.findFirst({
        take: 1,
        skip: parseInt(number_of_skip, 10),
        where: {
          user_id,
          client_id,
          user: { ...getUsersSearchParams(search_string, splittedSearchFilter) },
        },
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },

        orderBy: orderParams,
      });

      if (!role) return [];

      firstElement = role.user;
    }

    const users = await prisma.role.findMany({
      take: parseInt(number_of_records, 10) || undefined,
      skip: last_record_id ? 1 : undefined,
      cursor:
        firstElement?.id || last_record_id
          ? {
              user_id_client_id: {
                user_id: firstElement?.id || parseInt(last_record_id, 10),
                client_id,
              },
            }
          : undefined,
      where: {
        client_id,
        user_id,
        user: { ...getUsersSearchParams(search_string, splittedSearchFilter) },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            birthdate: true,
            family_name: true,
            given_name: true,
            nickname: true,
            login: true,
            phone_number: true,
            picture: true,
            public_profile_claims_oauth: true,
            public_profile_claims_gravatar: true,
            blocked: true,
            deleted: true,
            custom_fields: true,
            password_updated_at: true,
          },
        },
        role: true,
      },

      orderBy: orderParams,
    });

    if (admin_role === UserRoles.OWNER || admin_role === UserRoles.EDITOR) return users;
    if (admin_role === UserRoles.ADMIN) {
      const globalRole = await this.roleRepo.findRoleInApp(admin_id, CLIENT_ID);
      if (globalRole === UserRoles.OWNER) return users;
      else
        return users.map(({ user, role }) => {
          return {
            user:
              parseInt(admin_id, 10) === user.id
                ? user
                : {
                    ...Object.fromEntries(
                      Object.entries(user).filter(([field]) =>
                        user.public_profile_claims_oauth.includes(field),
                      ),
                    ),
                    public_profile_claims_oauth: user.public_profile_claims_oauth,
                    public_profile_claims_gravatar: user.public_profile_claims_gravatar,
                  },
            role,
            public_profile_claims_oauth: user.public_profile_claims_oauth,
            public_profile_claims_gravatar: user.public_profile_claims_gravatar,
          };
        });
    }
  }

  async update(params: dto.UpdateClientDto, client_id: string) {
    let data: any = {};
    const client = await prisma.client.findUnique({ where: { client_id } });

    if (client_id === CLIENT_ID) {
      for (const key of Object.keys(params)) {
        if (CLIENT_FIELDS_NOT_EDITABLE.includes(key)) {
          throw new BadRequestException(Ei18nCodes.T3E0067, { cause: key });
        }
      }
    }

    data = {
      client_id,
      ...params,
    };

    // Remove the application from the favorites list if it has become non-public
    if (params.catalog === false) {
      await prisma.favoriteClients.deleteMany({
        where: { client_id },
      });
    }

    // Update the application type
    if (params.type_id) {
      data.type = {
        connect: {
          id: params.type_id,
        },
      };
    } else if (params.type_id === null || params.type_id === '') {
      data.type = {
        disconnect: true,
      };
    }
    delete data['type_id'];

    if (data.avatar && client?.avatar !== data.avatar) {
      await deleteImageFromLocalPath(client.avatar);
    }
    if (data.cover && client?.cover !== data.cover) {
      await deleteImageFromLocalPath(client.cover);
    }

    const updatedClient = await prisma.client.update({
      where: { client_id },
      data,
    });
    this.updateCorsToOtherServices('auth');
    this.updateCorsToOtherServices('oidc');

    return updatedClient;
  }

  /**
   * Deleting an app
   * Only the app owner or account owner can delete an app
   */
  async delete(client_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    const avatar = await prisma.client.findUnique({
      where: { client_id },
      select: { avatar: true, cover: true },
    });
    if (avatar?.avatar) await deleteImageFromLocalPath(avatar.avatar);
    if (avatar?.cover) await deleteImageFromLocalPath(avatar.cover);

    // Remove the application from the database
    await prisma.client.deleteMany({
      where: {
        client_id,
      },
    });

    this.updateCorsToOtherServices('auth');
    this.updateCorsToOtherServices('oidc');
  }

  async deleteSessionsByClient(user_id: string, client_id: string, cookie) {
    try {
      await this.redis.revokeAllTokensByUserAndClientId(user_id, client_id, cookie);
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async findClientByCredentials(client_id: string, client_secret: string) {
    return await prisma.client.findUnique({ where: { client_id, client_secret } });
  }

  async getApplicationsCount(user_id, { search_string }: dto.GetApplicationsCountDto) {
    try {
      return await prisma.role.count({
        where: {
          user_id: parseInt(user_id, 10),
          client: search_string
            ? {
                OR: [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  { name: { contains: search_string, mode: 'insensitive' } },
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ],
              }
            : undefined,
          role: { in: [UserRoles.EDITOR, UserRoles.OWNER] },
        },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  /**
   * Getting the number of a user's apps that have been granted permissions
   */
  async getClientsCountByScope(
    user_id: string,
    { search_string }: dto.GetApplicationsCountDto,
  ): Promise<number> {
    const idInt = parseInt(user_id, 10);

    return prisma.scopes.count({
      where: {
        user_id: idInt,
        client: {
          AND: {
            NOT: { client_id: idInt === 1 ? undefined : CLIENT_ID },
            OR: search_string
              ? [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  { name: { contains: search_string, mode: 'insensitive' } },
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ]
              : undefined,
          },
        },
      },
    });
  }

  async addRule(client_id: string, rule_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    const isExist = await prisma.clientRule.findFirst({
      where: { client_id, rule_id: parseInt(rule_id) },
    });
    if (isExist) return;

    await prisma.client.update({
      where: { client_id },
      data: {
        rules: {
          create: { rule_id: parseInt(rule_id) },
        },
      },
    });
  }

  async deleteRule(client_id: string, rule_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    return prisma.client.update({
      where: { client_id },
      data: {
        rules: {
          deleteMany: { client_id, rule_id: parseInt(rule_id) },
        },
      },
    });
  }

  public async getWhiteList() {
    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      select: {
        domain: true,
      },
    };

    const clients = await prisma.client.findMany(findParams);
    const origins = clients
      .map((client) =>
        client.domain
          ? client.domain.replace(/^((?:[^\/]*\/){3}).*$/, '$1').replace(/\/$/, '')
          : null,
      )
      .filter(Boolean);
    return { origins };
  }

  async updateCorsToOtherServices(service: string) {
    const listClientsDomains = await this.getWhiteList();
    fetch(`${DOMAIN}/${service}/update-cors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listClientsDomains),
    })
      .then((res) => res.json())
      .catch((err) => console.error(err));
  }

  /**
   * Updating an avatar
   */
  async updateAvatar(params: dto.UpdateAvatarClientDto, client_id: string) {
    const client = await prisma.client.findUnique({ where: { client_id } });

    if (params.avatar && client?.avatar !== params.avatar) {
      await deleteImageFromLocalPath(client.avatar);
    }
    if (params.cover && client?.cover !== params.cover) {
      await deleteImageFromLocalPath(client.cover);
    }

    return await prisma.client.update({
      where: { client_id },
      data: {
        avatar: params.avatar,
        cover: params.cover,
      },
    });
  }

  /**
   * Updating a user role in an application
   */
  async updateRole(user_id: string, client_id: string, params: dto.UpdateRoleDTO) {
    const user = await prisma.role.findUnique({
      where: { user_id_client_id: { user_id: parseInt(user_id, 10), client_id } },
      include: { user: true },
    });

    const userRole = convertToRoles(user.role);

    if (userRole === UserRoles.OWNER) throw new BadRequestException(Ei18nCodes.T3E0009);

    if (params.role === UserRoles.OWNER) throw new BadRequestException(Ei18nCodes.T3E0010);

    if (userRole === params.role) return;

    if (params.role === UserRoles.USER) {
      const admins = await prisma.role.findMany({
        where: {
          client_id,
          role: { not: { in: [UserRoles.USER] } },
          user_id: { not: parseInt(user_id, 10) },
        },
        select: {
          user_id: true,
        },
      });
      if (!admins.length) throw new BadRequestException(Ei18nCodes.T3E0011);
    }

    let orgId = '';
    if (params.role === UserRoles.ADMIN) {
      if (client_id !== CLIENT_ID) {
        throw new BadRequestException(Ei18nCodes.T3E0067);
      }

      const org = await this.createOrgClient(user_id);
      orgId = org.client_id;
    }

    if (userRole === UserRoles.ADMIN)
      await prisma.client.deleteMany({
        where: {
          parent_id: null,
          Role: {
            some: {
              user_id: parseInt(user_id, 10),
              role: UserRoles.OWNER,
            },
          },
        },
      });

    await prisma.role.upsert({
      where: { user_id_client_id: { user_id: parseInt(user_id, 10), client_id } },
      update: {
        role: params.role,
      },
      create: { user_id: parseInt(user_id, 10), client_id, role: params.role },
    });

    return { orgId };
  }

  /**
   * Creating an organization client for a manager
   */
  private async createOrgClient(user_id: string) {
    const id = generateRandomString(22);
    const credential = await prisma.provider.findFirst({
      where: { type: PROVIDER_TYPE_CREDENTIALS },
    });
    return prisma.client.create({
      data: {
        widget_colors: { button_color: '#4C6AD4', font_color: '#fff', link_color: '#000' },
        name: 'Org' + user_id,
        domain: DOMAIN + '/' + id,
        client_id: id,
        client_secret: generateRandomString(87),
        grant_types: ['authorization_code', 'refresh_token'],
        redirect_uris: [DOMAIN + '/' + id + '/code', DOMAIN + '/' + id + '/login'],
        post_logout_redirect_uris: [DOMAIN + '/' + id],
        token_endpoint_auth_method: 'none',
        introspection_endpoint_auth_method: 'none',
        revocation_endpoint_auth_method: 'none',
        Role: {
          create: {
            user_id: parseInt(user_id, 10),
            role: UserRoles.OWNER,
          },
        },
        Provider_relations: { create: { provider_id: credential.id } },
      },
    });
  }

  /**
   * Deleting a user role in the application
   */
  async deleteRole(user_id: string, client_id: string) {
    const user = await prisma.role.findUnique({
      where: { user_id_client_id: { user_id: parseInt(user_id, 10), client_id } },
    });

    const userRole = convertToRoles(user.role);
    if (userRole === UserRoles.OWNER || userRole === UserRoles.ADMIN) {
      throw new BadRequestException(Ei18nCodes.T3E0025, {
        cause: userRole,
      });
    }

    if (client_id === CLIENT_ID) throw new BadRequestException(Ei18nCodes.T3E0012);

    await prisma.client.update({
      where: { client_id },
      data: {
        Role: {
          deleteMany: { user_id: parseInt(user_id, 10) },
        },
        Scopes: {
          deleteMany: { user_id: parseInt(user_id, 10) },
        },
      },
    });
  }

  async findRoleInApp(user_id: string, client_id: string) {
    return this.roleRepo.findRoleInApp(user_id, client_id);
  }
}
