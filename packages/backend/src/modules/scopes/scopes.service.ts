import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import fetch from 'node-fetch';
import { CLIENT_ID, DOMAIN } from 'src/constants';
import { ListInputDto } from 'src/custom.dto';
import { Ei18nCodes, SortDirection } from 'src/enums';
import { getInternalRequestHeaders } from 'src/internal-request';
import {
  buildClientNameSearchConditions,
  getLocalizedClientSortContext,
  sortItemsByLocalizedClientName,
} from 'src/utils/localized-client-name';
import { prisma } from '../prisma/prisma.client';
import { listProfileFields } from '../settings/settings.dto';
import { BindOidcScopeFieldDto, CreateOidcScopeDto, UpdateOidcScopeDto } from './scopes.dto';

const RESERVED_OIDC_SCOPES = new Set([
  'openid',
  'offline_access',
  'email',
  'phone',
  'profile',
  'accounts',
  'internal',
  'lk',
  'catalog',
  'locale',
]);

const GENERAL_PROFILE_FIELD_KEYS = new Set(listProfileFields.map((field) => field.field));
const OIDC_SCOPE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;

@Injectable()
export class ScopeService {
  private readonly prisma = prisma as any;

  /**
   * Getting a list of application permissions according to filters
   */
  public async list(params: ListInputDto, user_id: string) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;
    const searchValue = search?.trim();

    // Generate request parameters
    const findParams = {
      where: {
        ...filter,
        scopes: { not: '' },
        user_id,
        client: {
          client_id: { not: CLIENT_ID },
          OR: searchValue
            ? [
                ...buildClientNameSearchConditions(searchValue),
                { description: { contains: searchValue, mode: 'insensitive' } },
              ]
            : undefined,
        },
      },
      select: {
        id: true,
        client_id: true,
        scopes: true,
        created_at: true,
        client: {
          select: {
            client_id: true,
            name: true,
            description: true,
            domain: true,
            avatar: true,
            type: true,
            created_at: true,
          },
        },
      },
    } satisfies Prisma.ScopesFindManyArgs<DefaultArgs>;

    let scopes;
    let totalCount: number;

    if (sortBy === 'name') {
      const sortContext = await getLocalizedClientSortContext();
      const matchedScopes = await prisma.scopes.findMany(findParams);
      const sortedScopes = sortItemsByLocalizedClientName(matchedScopes, {
        sortDirection: sortDirection || SortDirection.ASC,
        sortContext,
        getClientName: (scope) => scope.client.name,
        getClientId: (scope) => scope.client.client_id,
      });
      const safeOffset = offset && offset > 0 ? offset : 0;
      const end = typeof limit === 'number' ? safeOffset + limit : undefined;

      scopes = sortedScopes.slice(safeOffset, end);
      totalCount = sortedScopes.length;
    } else {
      [scopes, totalCount] = await Promise.all([
        prisma.scopes.findMany({
          ...findParams,
          take: limit,
          skip: offset,
          orderBy: sortBy ? { [sortBy]: sortDirection } : undefined,
        }),
        prisma.scopes.count({ where: findParams.where }),
      ]);
    }

    // Transform the data for ease of use
    const scopesList = scopes.map((scope) => {
      return {
        id: scope.id,
        client_id: scope.client_id,
        scopes: scope.scopes ? scope.scopes.split(' ') : [],
        created_at: scope.created_at,
        client: (scope as any).client,
      };
    });

    return { scopes: scopesList, totalCount };
  }

  /**
   * Revoking permissions for the specified clients
   */
  public async delete(client_ids: string[], user_id: string) {
    if (client_ids.includes(CLIENT_ID)) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    // Remove all permissions for the specified clients
    await prisma.scopes.deleteMany({
      where: {
        user_id,
        client_id: { in: client_ids },
      },
    });
  }

  private assertOidcScopeName(name: string) {
    if (!OIDC_SCOPE_NAME_PATTERN.test(name)) {
      throw new BadRequestException('OIDC scope name has invalid format');
    }

    if (RESERVED_OIDC_SCOPES.has(name.toLowerCase())) {
      throw new BadRequestException('OIDC scope name is reserved');
    }
  }

  private async resolveOidcScopeOrganizationId(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { client_id: clientId },
      select: {
        client_id: true,
        parent_id: true,
      },
    });

    if (!client) {
      throw new BadRequestException(Ei18nCodes.T3E0071);
    }

    if (client.client_id === CLIENT_ID) {
      return CLIENT_ID;
    }

    if (client.parent_id && client.parent_id !== CLIENT_ID) {
      return client.parent_id;
    }

    if (!client.parent_id) {
      return client.client_id;
    }

    return CLIENT_ID;
  }

  private async notifyDynamicScopesChanged(organizationId: string) {
    try {
      await fetch(`${DOMAIN}/oidc/update-dynamic-scopes`, {
        method: 'POST',
        headers: await getInternalRequestHeaders(),
        body: JSON.stringify({ organization_id: organizationId }),
      });
    } catch (error) {
      console.warn('Failed to request dynamic OIDC scope refresh', error);
    }
  }

  private getOidcScopeGroupInclude() {
    return {
      fields: {
        orderBy: { order: 'asc' },
        include: {
          profile_field: {
            select: {
              id: true,
              key: true,
              title: true,
              active: true,
            },
          },
        },
      },
    };
  }

  private mapOidcScopeGroup(group: any) {
    return {
      id: group.id,
      organization_id: group.organization_id,
      name: group.name,
      icon: group.icon,
      title: group.title,
      description: group.description,
      active: group.active,
      created_at: group.created_at,
      updated_at: group.updated_at,
      fields: (group.fields || []).map((item: any) => ({
        profile_field_id: item.profile_field_id,
        field: item.profile_field.key,
        title: item.profile_field.title,
        active: item.profile_field.active,
        claim_name: item.claim_name || item.profile_field.key,
        order: item.order,
      })),
    };
  }

  private async findOidcScopeGroupOrThrow(clientId: string, scopeId: string) {
    const organizationId = await this.resolveOidcScopeOrganizationId(clientId);
    const group = await this.prisma.oidcScopeGroup.findFirst({
      where: {
        id: scopeId,
        organization_id: organizationId,
      },
      include: this.getOidcScopeGroupInclude(),
    });

    if (!group) {
      throw new NotFoundException('OIDC scope was not found');
    }

    return { organizationId, group };
  }

  private getOrganizationProfileFieldWhere(organizationId: string) {
    return organizationId === CLIENT_ID
      ? [{ organization_id: CLIENT_ID }]
      : [{ organization_id: CLIENT_ID }, { organization_id: organizationId }];
  }

  private async resolveCustomProfileField(params: BindOidcScopeFieldDto, organizationId: string) {
    if (!params.profile_field_id && !params.field) {
      throw new BadRequestException('profile_field_id or field is required');
    }

    const field = await prisma.profileField.findFirst({
      where: params.profile_field_id
        ? {
            id: params.profile_field_id,
            OR: this.getOrganizationProfileFieldWhere(organizationId),
          }
        : {
            key: params.field,
            active: true,
            OR: this.getOrganizationProfileFieldWhere(organizationId),
          },
      select: {
        id: true,
        key: true,
        title: true,
        active: true,
      },
    });

    if (!field || !field.active) {
      throw new BadRequestException('Custom profile field was not found');
    }

    if (GENERAL_PROFILE_FIELD_KEYS.has(field.key as any)) {
      throw new BadRequestException('Only custom profile fields can be bound to dynamic scopes');
    }

    return field;
  }

  private async resolveCustomProfileFields(fields: string[] = [], organizationId: string) {
    const uniqueFields = Array.from(new Set(fields.filter(Boolean)));

    if (!uniqueFields.length) {
      return [];
    }

    const profileFields = await prisma.profileField.findMany({
      where: {
        key: { in: uniqueFields },
        active: true,
        OR: this.getOrganizationProfileFieldWhere(organizationId),
      },
      select: {
        id: true,
        key: true,
        title: true,
        active: true,
      },
    });

    const byKey = new Map(profileFields.map((field) => [field.key, field]));
    const missingFields = uniqueFields.filter((field) => !byKey.has(field));
    if (missingFields.length) {
      throw new BadRequestException(
        `Custom profile fields were not found: ${missingFields.join(', ')}`,
      );
    }

    const generalFields = uniqueFields.filter((field) =>
      GENERAL_PROFILE_FIELD_KEYS.has(field as any),
    );
    if (generalFields.length) {
      throw new BadRequestException(
        `Only custom profile fields are allowed: ${generalFields.join(', ')}`,
      );
    }

    return uniqueFields.map((field) => byKey.get(field));
  }

  private async assertProfileFieldsAreNotBoundToOtherScopes(
    profileFieldIds: string[],
    scopeId?: string,
  ) {
    if (!profileFieldIds.length) {
      return;
    }

    const existingBindings = await this.prisma.oidcScopeGroupField.findMany({
      where: {
        profile_field_id: { in: profileFieldIds },
        ...(scopeId ? { scope_group_id: { not: scopeId } } : {}),
      },
      include: {
        scope_group: {
          select: {
            name: true,
          },
        },
        profile_field: {
          select: {
            key: true,
          },
        },
      },
    });

    if (existingBindings.length) {
      const conflicts = existingBindings.map(
        (binding: any) => `${binding.profile_field.key} -> ${binding.scope_group.name}`,
      );
      throw new BadRequestException(
        `Custom profile fields are already bound to OIDC scopes: ${conflicts.join(', ')}`,
      );
    }
  }

  public async listOidcScopeGroups(clientId: string) {
    const organizationId = await this.resolveOidcScopeOrganizationId(clientId);
    const groups = await this.prisma.oidcScopeGroup.findMany({
      where: {
        organization_id: organizationId,
      },
      include: this.getOidcScopeGroupInclude(),
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    return groups.map((group: any) => this.mapOidcScopeGroup(group));
  }

  public async createOidcScopeGroup(clientId: string, params: CreateOidcScopeDto) {
    this.assertOidcScopeName(params.name);

    const organizationId = await this.resolveOidcScopeOrganizationId(clientId);
    const existingScope = await this.prisma.oidcScopeGroup.findUnique({
      where: {
        organization_id_name: {
          organization_id: organizationId,
          name: params.name,
        },
      },
      select: { id: true },
    });

    if (existingScope) {
      throw new BadRequestException('OIDC scope already exists');
    }

    const fields = await this.resolveCustomProfileFields(params.fields, organizationId);
    await this.assertProfileFieldsAreNotBoundToOtherScopes(
      fields.map((field: any) => field.id),
    );
    const group = await this.prisma.oidcScopeGroup.create({
      data: {
        organization_id: organizationId,
        name: params.name,
        icon: params.icon ?? null,
        title: params.title,
        description: params.description ?? null,
        active: params.active ?? true,
        fields: {
          create: fields.map((field: any) => ({
            profile_field_id: field.id,
            order: 0,
          })),
        },
      },
      include: this.getOidcScopeGroupInclude(),
    });

    await this.notifyDynamicScopesChanged(organizationId);

    return this.mapOidcScopeGroup(group);
  }

  public async updateOidcScopeGroup(clientId: string, scopeId: string, params: UpdateOidcScopeDto) {
    const { organizationId } = await this.findOidcScopeGroupOrThrow(clientId, scopeId);

    if (params.name) {
      this.assertOidcScopeName(params.name);
    }

    const fields =
      params.fields === undefined
        ? undefined
        : await this.resolveCustomProfileFields(params.fields, organizationId);

    if (fields) {
      await this.assertProfileFieldsAreNotBoundToOtherScopes(
        fields.map((field: any) => field.id),
        scopeId,
      );
    }

    const group = await this.prisma.$transaction(async (tx: any) => {
      if (fields) {
        await tx.oidcScopeGroupField.deleteMany({
          where: { scope_group_id: scopeId },
        });
      }

      return tx.oidcScopeGroup.update({
        where: { id: scopeId },
        data: {
          ...(params.name ? { name: params.name } : {}),
          ...(params.icon !== undefined ? { icon: params.icon } : {}),
          ...(params.title !== undefined ? { title: params.title } : {}),
          ...(params.description !== undefined ? { description: params.description } : {}),
          ...(params.active !== undefined ? { active: params.active } : {}),
          ...(fields
            ? {
                fields: {
                  create: fields.map((field: any) => ({
                    profile_field_id: field.id,
                    order: 0,
                  })),
                },
              }
            : {}),
        },
        include: this.getOidcScopeGroupInclude(),
      });
    });

    if (group.organization_id !== organizationId) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    await this.notifyDynamicScopesChanged(organizationId);

    return this.mapOidcScopeGroup(group);
  }

  public async bindOidcScopeField(
    clientId: string,
    scopeId: string,
    params: BindOidcScopeFieldDto,
  ) {
    const { organizationId } = await this.findOidcScopeGroupOrThrow(clientId, scopeId);
    const field = await this.resolveCustomProfileField(params, organizationId);
    await this.assertProfileFieldsAreNotBoundToOtherScopes([field.id], scopeId);

    await this.prisma.oidcScopeGroupField.upsert({
      where: {
        scope_group_id_profile_field_id: {
          scope_group_id: scopeId,
          profile_field_id: field.id,
        },
      },
      update: {
        claim_name: params.claim_name ?? null,
        order: 0,
      },
      create: {
        scope_group_id: scopeId,
        profile_field_id: field.id,
        claim_name: params.claim_name ?? null,
        order: 0,
      },
    });

    const group = await this.prisma.oidcScopeGroup.findUnique({
      where: { id: scopeId },
      include: this.getOidcScopeGroupInclude(),
    });

    await this.notifyDynamicScopesChanged(organizationId);

    return this.mapOidcScopeGroup(group);
  }

  public async deleteOidcScopeField(clientId: string, scopeId: string, profileFieldId: string) {
    const { organizationId } = await this.findOidcScopeGroupOrThrow(clientId, scopeId);

    await this.prisma.oidcScopeGroupField.delete({
      where: {
        scope_group_id_profile_field_id: {
          scope_group_id: scopeId,
          profile_field_id: profileFieldId,
        },
      },
    });

    await this.notifyDynamicScopesChanged(organizationId);
  }

  public async deleteOidcScopeGroup(clientId: string, scopeId: string) {
    const { organizationId } = await this.findOidcScopeGroupOrThrow(clientId, scopeId);

    await this.prisma.oidcScopeGroup.delete({
      where: { id: scopeId },
    });

    await this.notifyDynamicScopesChanged(organizationId);
  }
}
