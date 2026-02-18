import { BadRequestException, Injectable } from '@nestjs/common';
import { ListInputDto } from 'src/custom.dto';
import { prisma } from '../prisma/prisma.client';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { CreateInvitationDto } from './invitation.dto';
import { app } from 'src/main';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../providers/collection/email/email.service';
import { NotificationAction, TEmailProvider } from '../providers/collection/email/email.types';
import { Ei18nCodes, EProviderTypes } from 'src/enums';
import { UsersService } from '../users';
import { DOMAIN } from 'src/constants';

@Injectable()
export class InvitationService {
  get settingsService() {
    return app.get(SettingsService, { strict: false });
  }

  get mailService() {
    return app.get(EmailService, { strict: false });
  }

  get userService() {
    return app.get(UsersService, { strict: false });
  }

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

    if (!client.parent_id) throw new BadRequestException(Ei18nCodes.T3E0067);

    // Check existing users in client
    const existRoles = await prisma.role.findMany({
      where: {
        client_id,
        user: { email: { in: emails } },
      },
      select: { user: { select: { email: true } } },
    });
    emails = emails.filter((e) => !existRoles.find((r) => r.user.email === e));

    if (!emails.length) {
      throw new BadRequestException(Ei18nCodes.T3E0099);
    }

    const existEmails = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });

    // Validations
    const failedEmails: string[] = [];
    const forCheck = emails.filter((e) => !existEmails.find((u) => u.email === e));
    if (forCheck.length) {
      const rules = await this.settingsService.getRulesValidations('email');
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

    // Check existing invitations
    await prisma.clientInvitation.deleteMany({
      where: {
        client_id,
        email: { in: emails },
      },
    });

    await prisma.clientInvitation.createMany({
      data: emails.map((e) => {
        return { email: e, client_id };
      }),
    });

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

    // Send invitation email
    await this.mailService.sendMail(
      emails,
      {
        action: NotificationAction.invite,
        app_name: client.name || '',
        reference: client.domain || '',
        link_name: DOMAIN,
      },
      providerEmail,
    );

    return failedEmails;
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

    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id) },
    });

    if (!user.email) {
      return { items: [], totalCount: 0 };
    }

    const findParams: Prisma.ClientInvitationFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        email: user.email,
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
    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id) },
    });

    if (!user.email) return;

    const inv = await prisma.clientInvitation.findUnique({
      where: { id: invitation_id, email: user.email },
    });

    if (!inv) return;

    await prisma.clientInvitation.deleteMany({
      where: {
        id: invitation_id,
        email: user.email,
      },
    });

    return inv;
  }

  async confirmByUser(user_id: string, invitation_id: string) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id) },
    });

    if (!user.email) return;

    const inv = await prisma.clientInvitation.findUnique({
      where: { id: invitation_id, email: user.email },
    });

    if (!inv) return;

    const role = await prisma.role.findFirst({
      where: {
        client_id: inv.client_id,
        user_id: parseInt(user_id),
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
}
