import { BadRequestException, Injectable } from '@nestjs/common';
import { ListInputDto } from 'src/custom.dto';
import { prisma } from '../prisma/prisma.client';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { CreateInvitationDto } from './invitation.dto';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../providers/collection/email/email.service';
import { NotificationAction, TEmailProvider } from '../providers/collection/email/email.types';
import { Ei18nCodes, EProviderTypes, UserRoles } from 'src/enums';
import { UsersService } from '../users';
import { CLIENT_ID, DOMAIN } from 'src/constants';
import { getOrganizationId } from 'src/helpers';
import { legacyUserInclude, toLegacyUser } from '../repository/user-compat';
import {
  getLegacyUserExternalAccountEmails,
  legacyUserEmailExternalAccountTypes,
} from '../repository/user-search';
import {
  syncGuestsMembershipForUser,
  syncOrganizationGuestsMembershipForUser,
} from '../prisma/guests-group';
import { getDefaultLocale, resolveLocalizedText } from 'src/utils/localized-text';

@Injectable()
export class InvitationService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mailService: EmailService,
    private readonly userService: UsersService,
  ) {}

  async getAllByClient(client_id: string, params: ListInputDto) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    const findParams: Prisma.ClientInvitationFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        client_id,
        email: { contains: search, mode: 'insensitive' },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    const [items, totalCount] = await Promise.all([
      prisma.clientInvitation.findMany(findParams),
      prisma.clientInvitation.count({ where: findParams.where }),
    ]);

    return { items, totalCount };
  }

  async create(params: CreateInvitationDto, client_id: string) {
    let emails = params.email;

    if (!emails.length) return;

    emails = Array.from(new Set(emails));

    const client = await prisma.client.findUnique({
      where: { client_id },
    });
    if (!client) return;

    if (!client.parent_id && client.client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    // Check existing users in client
    const existingUsers = await prisma.user.findMany({
      where: {
        externalAccounts: {
          some: {
            sub: {
              in: emails,
            },
            type: {
              in: [...legacyUserEmailExternalAccountTypes],
            },
          },
        },
      },
      include: legacyUserInclude,
    });
    const existingUsersLegacy = existingUsers.map((user) => toLegacyUser(user)).filter(Boolean);

    const existRoles = await prisma.role.findMany({
      where: {
        client_id,
        user_id: {
          in: existingUsersLegacy.map((user) => user.id),
        },
      },
      select: { user_id: true },
    });
    const existingUserEmailsById = new Map(
      existingUsersLegacy.map((user) => [
        user.id,
        new Set(getLegacyUserExternalAccountEmails(user)),
      ]),
    );
    const existingUserEmails = new Set(
      Array.from(existingUserEmailsById.values()).flatMap((userEmails) => Array.from(userEmails)),
    );

    emails = emails.filter(
      (email) => !existRoles.find((role) => existingUserEmailsById.get(role.user_id)?.has(email)),
    );

    if (!emails.length) {
      throw new BadRequestException(Ei18nCodes.T3E0099);
    }

    // Validations
    const failedEmails: string[] = [];
    const forCheck = emails.filter((email) => !existingUserEmails.has(email));
    if (forCheck.length) {
      const rules = await this.settingsService.getRulesValidations('email', true);
      for (const rule of rules) {
        const regex = new RegExp(rule.regex);
        for (const email of forCheck) {
          if (!regex.test(email)) {
            failedEmails.push(email);
            emails = emails.filter((e) => e !== email);
          }
        }
      }
    }

    if (!emails.length) {
      return failedEmails;
    }

    await prisma.clientInvitation.createMany({
      data: emails.map((email) => ({ client_id, email })),
      skipDuplicates: true,
    });

    const providerEmail = await this.resolveInvitationProvider(client);
    const defaultLocale = await getDefaultLocale();
    const appName = resolveLocalizedText(client.name, defaultLocale, defaultLocale);

    // Send invitation email
    await this.mailService.sendMail(
      emails,
      {
        action: NotificationAction.invite,
        app_name: appName,
        reference: client.domain || '',
        link_name: DOMAIN,
      },
      providerEmail,
    );

    return failedEmails;
  }

  async ensureSystemInvitation(
    client_id: string,
    email: string,
    options?: { sendEmail?: boolean },
  ) {
    const normalizedEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedEmail) {
      return false;
    }

    const client = await prisma.client.findUnique({
      where: { client_id },
    });
    if (!client) {
      return false;
    }

    const existing = await prisma.clientInvitation.findFirst({
      where: {
        client_id,
        email: normalizedEmail,
      },
      select: { id: true },
    });
    if (existing) {
      return false;
    }

    await prisma.clientInvitation.create({
      data: {
        client_id,
        email: normalizedEmail,
      },
    });

    if (options?.sendEmail ?? false) {
      const providerEmail = await this.resolveInvitationProvider(client);
      const defaultLocale = await getDefaultLocale();
      const appName = resolveLocalizedText(client.name, defaultLocale, defaultLocale);
      await this.mailService.sendMail(
        [normalizedEmail],
        {
          action: NotificationAction.invite,
          app_name: appName,
          reference: client.domain || '',
          link_name: DOMAIN,
        },
        providerEmail,
      );
    }

    return true;
  }

  async deleteByClient(client_id: string, invitation_id: string) {
    const inv = await prisma.clientInvitation.findUnique({
      where: { id: invitation_id },
    });
    await prisma.clientInvitation.deleteMany({
      where: {
        id: invitation_id,
        client_id,
      },
    });

    return inv;
  }

  async getAllByUser(user_id: string, params: ListInputDto) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    const userEmails = await this.getUserInvitationEmails(user_id);
    if (!userEmails.length) {
      return { items: [], totalCount: 0 };
    }

    const findParams: Prisma.ClientInvitationFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        email: { in: userEmails },
      },
      include: {
        client: { select: { name: true, domain: true, avatar: true } },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    const [items, totalCount] = await Promise.all([
      prisma.clientInvitation.findMany(findParams),
      prisma.clientInvitation.count({ where: findParams.where }),
    ]);

    return { items, totalCount };
  }

  async deleteByUser(user_id: string, invitation_id: string) {
    const userEmails = await this.getUserInvitationEmails(user_id);
    if (!userEmails.length) return;

    const inv = await prisma.clientInvitation.findFirst({
      where: {
        id: invitation_id,
        email: { in: userEmails },
      },
    });

    if (!inv) return;

    await prisma.clientInvitation.deleteMany({
      where: {
        id: invitation_id,
        email: { in: userEmails },
      },
    });

    return inv;
  }

  async confirmByUser(user_id: string, invitation_id: string) {
    const userEmails = await this.getUserInvitationEmails(user_id);
    if (!userEmails.length) return;

    const inv = await prisma.clientInvitation.findFirst({
      where: {
        id: invitation_id,
        email: { in: userEmails },
      },
    });

    if (!inv) return;

    await this.transferUserToInvitationOrganization(user_id, inv.client_id);

    const role = await prisma.role.findFirst({
      where: {
        client_id: inv.client_id,
        user_id,
      },
    });

    if (!role) {
      await this.userService.setUserRoleInApp(user_id, inv.client_id);
    }

    await prisma.clientInvitation.deleteMany({
      where: {
        id: invitation_id,
      },
    });

    return inv;
  }

  private async getUserInvitationEmails(user_id: string) {
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      include: legacyUserInclude,
    });
    const legacyUser = toLegacyUser(user);

    return getLegacyUserExternalAccountEmails(legacyUser);
  }

  private async resolveInvitationProvider(client: { client_id: string; parent_id: string | null }) {
    let providerEmail: TEmailProvider;
    const clientEmail = await prisma.provider.findFirst({
      where: { type: EProviderTypes.EMAIL_CUSTOM, client_id: client.client_id },
    });
    providerEmail = (clientEmail as TEmailProvider) || undefined;

    if (!providerEmail && client.parent_id) {
      const orgEmail = await prisma.provider.findFirst({
        where: { type: EProviderTypes.EMAIL_CUSTOM, client_id: client.parent_id },
      });
      providerEmail = (orgEmail as TEmailProvider) || undefined;
    }

    return providerEmail;
  }

  private async transferUserToInvitationOrganization(user_id: string, invitedClientId: string) {
    const invitedClient = await prisma.client.findUnique({
      where: { client_id: invitedClientId },
      select: {
        client_id: true,
        parent_id: true,
      },
    });
    if (!invitedClient) {
      return;
    }

    const targetOrgId = await getOrganizationId(invitedClient.client_id);
    if (!targetOrgId || targetOrgId === CLIENT_ID) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        org_id: true,
      },
    });
    if (!user) {
      return;
    }

    if (user.org_id === targetOrgId) {
      return;
    }

    const previousOrgId = user.org_id;

    const [targetOrgClient, globalRole, oldOrgClients] = await Promise.all([
      prisma.client.findUnique({
        where: { client_id: targetOrgId },
        select: {
          client_id: true,
          folder_id: true,
        },
      }),
      prisma.role.findUnique({
        where: {
          user_id_client_id: {
            user_id,
            client_id: CLIENT_ID,
          },
        },
        select: {
          role: true,
        },
      }),
      user.org_id && user.org_id !== CLIENT_ID
        ? prisma.client.findMany({
            where: {
              OR: [{ client_id: user.org_id }, { parent_id: user.org_id }],
            },
            select: {
              client_id: true,
            },
          })
        : Promise.resolve([]),
    ]);

    if (!targetOrgClient?.folder_id) {
      throw new BadRequestException('Directory folder not found for organization');
    }

    const targetRootRole =
      globalRole?.role === UserRoles.TRUSTED_USER ? UserRoles.TRUSTED_USER : UserRoles.USER;
    const oldOrgClientIds = oldOrgClients.map((client) => client.client_id);

    await prisma.$transaction(async (tx) => {
      if (oldOrgClientIds.length > 0) {
        await tx.role.deleteMany({
          where: {
            user_id,
            client_id: { in: oldOrgClientIds },
          },
        });
      }

      await tx.user.update({
        where: { id: user_id },
        data: {
          org_id: targetOrgId,
          folder_id: targetOrgClient.folder_id,
        },
      });

      await tx.role.upsert({
        where: {
          user_id_client_id: {
            user_id,
            client_id: targetOrgId,
          },
        },
        update: {
          role: targetRootRole,
        },
        create: {
          user_id,
          client_id: targetOrgId,
          role: targetRootRole,
        },
      });

      await syncGuestsMembershipForUser(tx, user_id, CLIENT_ID);

      if (previousOrgId && previousOrgId !== CLIENT_ID && previousOrgId !== targetOrgId) {
        await syncOrganizationGuestsMembershipForUser(tx, user_id, previousOrgId);
      }

      await syncOrganizationGuestsMembershipForUser(tx, user_id, targetOrgId);
    });
  }
}
