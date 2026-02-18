import { Module } from '@nestjs/common';
import { CLIENT_ID, EMAIL_PROVIDER } from 'src/constants';
import { ELocales, EProviderTypes } from 'src/enums';
import { prisma } from 'src/modules/prisma/prisma.client';
import { RedisModule } from '../../../redis/redis.module';
import { SettingsModule } from '../../../settings/settings.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { NotificationAction } from './email.types';

@Module({
  imports: [RedisModule, SettingsModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class MailModule {
  async onModuleInit() {
    //#region EMAIL
    const initFlag = (await prisma.client.count()) === 1;
    if (initFlag && EMAIL_PROVIDER) {
      const emailProvider = await prisma.provider.findFirst({
        where: { type: EProviderTypes.EMAIL },
      });
      if (!emailProvider) {
        await prisma.provider.create({
          data: {
            type: EProviderTypes.EMAIL,
            name: 'Email',
            avatar: 'public/default/email.svg',
            is_public: false,
            client_id: CLIENT_ID,
            params: {
              mail_port: EMAIL_PROVIDER.port,
              root_mail: EMAIL_PROVIDER.root_mail,
              mail_hostname: EMAIL_PROVIDER.hostname,
              mail_password: EMAIL_PROVIDER.password,
              mail_code_ttl_sec: EMAIL_PROVIDER.ttl,
            },
            Provider_relations: { create: { client_id: CLIENT_ID } },
          },
        });
      }
    }
    //#endregion

    //#region Email templates
    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.account_create, locale: ELocales.ru } },
      create: {
        locale: ELocales.ru,
        action: NotificationAction.account_create,
        title: 'Регистрация',
        subject: 'Вам создан аккаунт {{project_name}}',
        content: `<p>
{{#given_name}}Здравствуйте, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Доброго времени суток!{{/given_name}}
</p>
<p>
Вы успешно зарегистрированы на <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Вам создан аккаунт на сервисе <span style="color: {{accent}}">{{project_name}}</span>
</p>
<p>
Логин - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Пароль - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
С уважением, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_code, locale: ELocales.ru },
      },
      create: {
        locale: ELocales.ru,
        action: NotificationAction.confirmation_code,
        title: 'Код подтверждения',
        subject: 'Код для подтверждения электронной почты',
        content: `<p>
{{#given_name}}Здравствуйте, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Доброго времени суток!{{/given_name}}
</p>
<p>
Вы получили это письмо, потому что ваша почта была указана в <span>{{app_name}}</span>.
</p>
<p>
Для подтверждения адреса электронной почты введите код: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Код будет действителен до <span>{{expires_date}}</span> г. Время указано в UTC{{timezone}} часовом поясе.
</p>
<p style="margin-top: 34px;">
С уважением, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_link, locale: ELocales.ru },
      },
      create: {
        locale: ELocales.ru,
        action: NotificationAction.confirmation_link,
        title: 'Ссылка подтверждения',
        subject: 'Код для подтверждения электронной почты',
        content: `<p>
{{#given_name}}Здравствуйте, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Доброго времени суток!{{/given_name}}
</p>
<p>
Вы получили это письмо, потому что ваша почта была указана в <span>{{app_name}}</span>.
</p>
<p>
Для подтверждения адреса электронной почты введите код: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Или пройдите по <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>ссылке</a>.
</p>
<p>
Ссылка и код будут действительны до <span>{{expires_date}}</span> г. Время указано в UTC {{timezone}} часовом поясе.
</p>
<p style="margin-top: 34px;">
С уважением, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.password_change, locale: ELocales.ru } },
      create: {
        locale: ELocales.ru,
        action: NotificationAction.password_change,
        title: 'Изменение пароля',
        subject: 'Вам изменен пароль',
        content: `<p>
{{#given_name}}Здравствуйте, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Доброго времени суток!{{/given_name}}
</p>
<p>
Вам изменили пароль на сервисе <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Логин - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Пароль - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
С уважением, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.password_recover, locale: ELocales.ru },
      },
      create: {
        locale: ELocales.ru,
        action: NotificationAction.password_recover,
        title: 'Запрос восстановления пароля',
        subject: 'Код для восстановления пароля',
        content: `<p>
{{#given_name}}Здравствуйте, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Доброго времени суток!{{/given_name}}
</p>
<p>
Вы запросили восстановление пароля для <span>{{app_name}}</span>.
</p>
<p>
Для восстановления пароля введите код: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Код будет действителен до <span>{{expires_date}}</span> г. Время указано в UTC{{timezone}} часовом поясе.
</p>
<p style="margin-top: 34px;">
С уважением, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });
    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.invite, locale: ELocales.ru },
      },
      create: {
        locale: ELocales.ru,
        action: NotificationAction.invite,
        title: 'Приглашение',
        subject: 'Приглашение стать участником в {{app_name}}',
        content: `<p>
Доброго времени суток!
</p>
<p>
Вас приглашают стать участником сервиса {{app_name}}.
</p>
<p>
Для быстрого перехода в сервис перейдите по <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>ссылке</a>.
</p>
<p>
Или примите приглашение в <a href={{{link_name}}} style="color:{{accent}}; text-decoration:none";>личном кабинете</a>.
</p>
</p>`,
      },
      update: {},
    });
    //#endregion

    //#region Email templates EN
    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.account_create, locale: ELocales.en } },
      create: {
        locale: ELocales.en,
        action: NotificationAction.account_create,
        title: 'Registration',
        subject: 'Your account has been created for {{project_name}}',
        content: `<p>
{{#given_name}}Hello, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hello!{{/given_name}}
</p>
<p>
You have been successfully registered on <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Your account has been created on the <span style="color: {{accent}}">{{project_name}}</span> service.
</p>
<p>
Login - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Password - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Best regards, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_code, locale: ELocales.en },
      },
      create: {
        locale: ELocales.en,
        action: NotificationAction.confirmation_code,
        title: 'Confirmation Code',
        subject: 'Code to confirm your email',
        content: `<p>
{{#given_name}}Hello, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hello!{{/given_name}}
</p>
<p>
You received this email because your email was specified in <span>{{app_name}}</span>.
</p>
<p>
To confirm your email address, enter the code: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
The code will be valid until <span>{{expires_date}}</span>. Time is in UTC{{timezone}} timezone.
</p>
<p style="margin-top: 34px;">
Best regards, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_link, locale: ELocales.en },
      },
      create: {
        locale: ELocales.en,
        action: NotificationAction.confirmation_link,
        title: 'Confirmation Link',
        subject: 'Code to confirm your email',
        content: `<p>
{{#given_name}}Hello, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hello!{{/given_name}}
</p>
<p>
You received this email because your email was specified in <span>{{app_name}}</span>.
</p>
<p>
To confirm your email address, enter the code: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Or follow the <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>link</a>.
</p>
<p>
The link and code will be valid until <span>{{expires_date}}</span>. Time is in UTC {{timezone}} timezone.
</p>
<p style="margin-top: 34px;">
Best regards, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.password_change, locale: ELocales.en } },
      create: {
        locale: ELocales.en,
        action: NotificationAction.password_change,
        title: 'Password Change',
        subject: 'Your password has been changed',
        content: `<p>
{{#given_name}}Hello, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hello!{{/given_name}}
</p>
<p>
Your password has been changed on the <span style="color: {{accent}}">{{link_name}}</span> service.
</p>
<p>
Login - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Password - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Best regards, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.password_recover, locale: ELocales.en },
      },
      create: {
        locale: ELocales.en,
        action: NotificationAction.password_recover,
        title: 'Password Recovery Request',
        subject: 'Code to recover your password',
        content: `<p>
{{#given_name}}Hello, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hello!{{/given_name}}
</p>
<p>
You requested password recovery for <span>{{app_name}}</span>.
</p>
<p>
To recover your password, enter the code: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
The code will be valid until <span>{{expires_date}}</span>. Time is in UTC{{timezone}} timezone.
</p>
<p style="margin-top: 34px;">
Best regards, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });
    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.invite, locale: ELocales.en },
      },
      create: {
        locale: ELocales.en,
        action: NotificationAction.invite,
        title: 'Invitation',
        subject: 'Invitation to become a member of {{app_name}}',
        content: `<p>
Good day!
</p>
<p>
You are invited to become a member of the {{app_name}} service.
</p>
<p>
To quickly access the service, follow the <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>link</a>.
</p>
<p>
Or accept the invitation in the <a href={{{link_name}}} style="color:{{accent}}; text-decoration:none";>personal account</a>.
</p>
</p>`,
      },
      update: {},
    });
    //#endregion

    //#region Email templates ES
    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.account_create, locale: ELocales.es } },
      create: {
        locale: ELocales.es,
        action: NotificationAction.account_create,
        title: 'Registro',
        subject: 'Tu cuenta ha sido creada para {{project_name}}',
        content: `<p>
{{#given_name}}Hola, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}¡Hola!{{/given_name}}
</p>
<p>
Te has registrado exitosamente en <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Tu cuenta ha sido creada en el servicio <span style="color: {{accent}}">{{project_name}}</span>.
</p>
<p>
Usuario - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Contraseña - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Atentamente, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_code, locale: ELocales.es },
      },
      create: {
        locale: ELocales.es,
        action: NotificationAction.confirmation_code,
        title: 'Código de Confirmación',
        subject: 'Código para confirmar tu correo electrónico',
        content: `<p>
{{#given_name}}Hola, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}¡Hola!{{/given_name}}
</p>
<p>
Recibiste este correo porque tu email fue especificado en <span>{{app_name}}</span>.
</p>
<p>
Para confirmar tu dirección de correo electrónico, ingresa el código: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
El código será válido hasta <span>{{expires_date}}</span>. La hora está en zona horaria UTC{{timezone}}.
</p>
<p style="margin-top: 34px;">
Atentamente, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_link, locale: ELocales.es },
      },
      create: {
        locale: ELocales.es,
        action: NotificationAction.confirmation_link,
        title: 'Enlace de Confirmación',
        subject: 'Código para confirmar tu correo electrónico',
        content: `<p>
{{#given_name}}Hola, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}¡Hola!{{/given_name}}
</p>
<p>
Recibiste este correo porque tu email fue especificado en <span>{{app_name}}</span>.
</p>
<p>
Para confirmar tu dirección de correo electrónico, ingresa el código: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
O sigue el <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>enlace</a>.
</p>
<p>
El enlace y el código serán válidos hasta <span>{{expires_date}}</span>. La hora está en zona horaria UTC {{timezone}}.
</p>
<p style="margin-top: 34px;">
Atentamente, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.password_change, locale: ELocales.es } },
      create: {
        locale: ELocales.es,
        action: NotificationAction.password_change,
        title: 'Cambio de Contraseña',
        subject: 'Tu contraseña ha sido cambiada',
        content: `<p>
{{#given_name}}Hola, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}¡Hola!{{/given_name}}
</p>
<p>
Tu contraseña ha sido cambiada en el servicio <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Usuario - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Contraseña - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Atentamente, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.password_recover, locale: ELocales.es },
      },
      create: {
        locale: ELocales.es,
        action: NotificationAction.password_recover,
        title: 'Solicitud de Recuperación de Contraseña',
        subject: 'Código para recuperar tu contraseña',
        content: `<p>
{{#given_name}}Hola, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}¡Hola!{{/given_name}}
</p>
<p>
Solicitaste la recuperación de contraseña para <span>{{app_name}}</span>.
</p>
<p>
Para recuperar tu contraseña, ingresa el código: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
El código será válido hasta <span>{{expires_date}}</span>. La hora está en zona horaria UTC{{timezone}}.
</p>
<p style="margin-top: 34px;">
Atentamente, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });
    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.invite, locale: ELocales.es },
      },
      create: {
        locale: ELocales.es,
        action: NotificationAction.invite,
        title: 'Invitación',
        subject: 'Invitación para convertirse en miembro de {{app_name}}',
        content: `<p>
¡Buen día!
</p>
<p>
Te invitan a convertirse en miembro del servicio {{app_name}}.
</p>
<p>
Para un acceso rápido al servicio, sigue el <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>enlace</a>.
</p>
<p>
O acepta la invitación en <a href={{{link_name}}} style="color:{{accent}}; text-decoration:none";>tu cuenta personal</a>.
</p>
</p>`,
      },
      update: {},
    });
    //#endregion

    //#region Email templates FR
    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.account_create, locale: ELocales.fr } },
      create: {
        locale: ELocales.fr,
        action: NotificationAction.account_create,
        title: 'Inscription',
        subject: 'Votre compte a été créé pour {{project_name}}',
        content: `<p>
{{#given_name}}Bonjour, <b>{{given_name}}</b> !{{/given_name}}
{{^given_name}}Bonjour !{{/given_name}}
</p>
<p>
Vous vous êtes inscrit avec succès sur <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Votre compte a été créé sur le service <span style="color: {{accent}}">{{project_name}}</span>.
</p>
<p>
Identifiant - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Mot de passe - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Cordialement, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_code, locale: ELocales.fr },
      },
      create: {
        locale: ELocales.fr,
        action: NotificationAction.confirmation_code,
        title: 'Code de Confirmation',
        subject: 'Code pour confirmer votre email',
        content: `<p>
{{#given_name}}Bonjour, <b>{{given_name}}</b> !{{/given_name}}
{{^given_name}}Bonjour !{{/given_name}}
</p>
<p>
Vous avez reçu cet email car votre adresse email a été spécifiée dans <span>{{app_name}}</span>.
</p>
<p>
Pour confirmer votre adresse email, saisissez le code : <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Le code sera valide jusqu'au <span>{{expires_date}}</span>. L'heure est en fuseau horaire UTC{{timezone}}.
</p>
<p style="margin-top: 34px;">
Cordialement, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_link, locale: ELocales.fr },
      },
      create: {
        locale: ELocales.fr,
        action: NotificationAction.confirmation_link,
        title: 'Lien de Confirmation',
        subject: 'Code pour confirmer votre email',
        content: `<p>
{{#given_name}}Bonjour, <b>{{given_name}}</b> !{{/given_name}}
{{^given_name}}Bonjour !{{/given_name}}
</p>
<p>
Vous avez reçu cet email car votre adresse email a été spécifiée dans <span>{{app_name}}</span>.
</p>
<p>
Pour confirmer votre adresse email, saisissez le code : <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Ou suivez le <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>lien</a>.
</p>
<p>
Le lien et le code seront valides jusqu'au <span>{{expires_date}}</span>. L'heure est en fuseau horaire UTC {{timezone}}.
</p>
<p style="margin-top: 34px;">
Cordialement, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.password_change, locale: ELocales.fr } },
      create: {
        locale: ELocales.fr,
        action: NotificationAction.password_change,
        title: 'Changement de Mot de Passe',
        subject: 'Votre mot de passe a été changé',
        content: `<p>
{{#given_name}}Bonjour, <b>{{given_name}}</b> !{{/given_name}}
{{^given_name}}Bonjour !{{/given_name}}
</p>
<p>
Votre mot de passe a été changé sur le service <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Identifiant - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Mot de passe - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Cordialement, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.password_recover, locale: ELocales.fr },
      },
      create: {
        locale: ELocales.fr,
        action: NotificationAction.password_recover,
        title: 'Demande de Récupération de Mot de Passe',
        subject: 'Code pour récupérer votre mot de passe',
        content: `<p>
{{#given_name}}Bonjour, <b>{{given_name}}</b> !{{/given_name}}
{{^given_name}}Bonjour !{{/given_name}}
</p>
<p>
Vous avez demandé la récupération de mot de passe pour <span>{{app_name}}</span>.
</p>
<p>
Pour récupérer votre mot de passe, saisissez le code : <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Le code sera valide jusqu'au <span>{{expires_date}}</span>. L'heure est en fuseau horaire UTC{{timezone}}.
</p>
<p style="margin-top: 34px;">
Cordialement, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });
    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.invite, locale: ELocales.fr },
      },
      create: {
        locale: ELocales.fr,
        action: NotificationAction.invite,
        title: 'Invitation',
        subject: 'Invitation à devenir membre de {{app_name}}',
        content: `<p>
Bonjour,
</p>
<p>
Vous êtes invité à devenir membre du service {{app_name}}.
</p>
<p>
Pour un accès rapide au service, veuillez suivre le <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>lien</a>.
</p>
<p>
Ou acceptez l'invitation dans <a href={{{link_name}}} style="color:{{accent}}; text-decoration:none";>votre espace personnel</a>.
</p>
</p>`,
      },
      update: {},
    });
    //#endregion

    //#region Email templates DE
    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.account_create, locale: ELocales.de } },
      create: {
        locale: ELocales.de,
        action: NotificationAction.account_create,
        title: 'Registrierung',
        subject: 'Ihr Konto wurde für {{project_name}} erstellt',
        content: `<p>
{{#given_name}}Hallo, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hallo!{{/given_name}}
</p>
<p>
Sie haben sich erfolgreich bei <span style="color: {{accent}}">{{link_name}}</span> registriert.
</p>
<p>
Ihr Konto wurde im Service <span style="color: {{accent}}">{{project_name}}</span> erstellt.
</p>
<p>
Benutzername - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Passwort - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Mit freundlichen Grüßen, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_code, locale: ELocales.de },
      },
      create: {
        locale: ELocales.de,
        action: NotificationAction.confirmation_code,
        title: 'Bestätigungscode',
        subject: 'Code zur Bestätigung Ihrer E-Mail',
        content: `<p>
{{#given_name}}Hallo, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hallo!{{/given_name}}
</p>
<p>
Sie haben diese E-Mail erhalten, weil Ihre E-Mail-Adresse in <span>{{app_name}}</span> angegeben wurde.
</p>
<p>
Um Ihre E-Mail-Adresse zu bestätigen, geben Sie den Code ein: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Der Code ist gültig bis <span>{{expires_date}}</span>. Die Zeit ist in UTC{{timezone}} Zeitzone.
</p>
<p style="margin-top: 34px;">
Mit freundlichen Grüßen, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_link, locale: ELocales.de },
      },
      create: {
        locale: ELocales.de,
        action: NotificationAction.confirmation_link,
        title: 'Bestätigungslink',
        subject: 'Code zur Bestätigung Ihrer E-Mail',
        content: `<p>
{{#given_name}}Hallo, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hallo!{{/given_name}}
</p>
<p>
Sie haben diese E-Mail erhalten, weil Ihre E-Mail-Adresse in <span>{{app_name}}</span> angegeben wurde.
</p>
<p>
Um Ihre E-Mail-Adresse zu bestätigen, geben Sie den Code ein: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Oder folgen Sie dem <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>Link</a>.
</p>
<p>
Der Link und der Code sind gültig bis <span>{{expires_date}}</span>. Die Zeit ist in UTC {{timezone}} Zeitzone.
</p>
<p style="margin-top: 34px;">
Mit freundlichen Grüßen, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.password_change, locale: ELocales.de } },
      create: {
        locale: ELocales.de,
        action: NotificationAction.password_change,
        title: 'Passwortänderung',
        subject: 'Ihr Passwort wurde geändert',
        content: `<p>
{{#given_name}}Hallo, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hallo!{{/given_name}}
</p>
<p>
Ihr Passwort wurde im Service <span style="color: {{accent}}">{{link_name}}</span> geändert.
</p>
<p>
Benutzername - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Passwort - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Mit freundlichen Grüßen, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.password_recover, locale: ELocales.de },
      },
      create: {
        locale: ELocales.de,
        action: NotificationAction.password_recover,
        title: 'Passwortwiederherstellungsanfrage',
        subject: 'Code zur Wiederherstellung Ihres Passworts',
        content: `<p>
{{#given_name}}Hallo, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Hallo!{{/given_name}}
</p>
<p>
Sie haben die Passwortwiederherstellung für <span>{{app_name}}</span> angefordert.
</p>
<p>
Um Ihr Passwort wiederherzustellen, geben Sie den Code ein: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Der Code ist gültig bis <span>{{expires_date}}</span>. Die Zeit ist in UTC{{timezone}} Zeitzone.
</p>
<p style="margin-top: 34px;">
Mit freundlichen Grüßen, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });
    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.invite, locale: ELocales.de },
      },
      create: {
        locale: ELocales.de,
        action: NotificationAction.invite,
        title: 'Einladung',
        subject: 'Einladung, Mitglied bei {{app_name}} zu werden',
        content: `<p>
Guten Tag!
</p>
<p>
Sie sind eingeladen, Mitglied des Dienstes {{app_name}} zu werden.
</p>
<p>
Für einen schnellen Zugang zum Dienst folgen Sie bitte dem <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>Link</a>.
</p>
<p>
Oder akzeptieren Sie die Einladung in <a href={{{link_name}}} style="color:{{accent}}; text-decoration:none";>Ihrem persönlichen Bereich</a>.
</p>
</p>`,
      },
      update: {},
    });
    //#endregion

    //#region Email templates IT
    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.account_create, locale: ELocales.it } },
      create: {
        locale: ELocales.it,
        action: NotificationAction.account_create,
        title: 'Registrazione',
        subject: 'Il tuo account è stato creato per {{project_name}}',
        content: `<p>
{{#given_name}}Ciao, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Ciao!{{/given_name}}
</p>
<p>
Ti sei registrato con successo su <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Il tuo account è stato creato nel servizio <span style="color: {{accent}}">{{project_name}}</span>.
</p>
<p>
Nome utente - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Password - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Cordiali saluti, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_code, locale: ELocales.it },
      },
      create: {
        locale: ELocales.it,
        action: NotificationAction.confirmation_code,
        title: 'Codice di Conferma',
        subject: 'Codice per confermare la tua email',
        content: `<p>
{{#given_name}}Ciao, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Ciao!{{/given_name}}
</p>
<p>
Hai ricevuto questa email perché la tua email è stata specificata in <span>{{app_name}}</span>.
</p>
<p>
Per confermare il tuo indirizzo email, inserisci il codice: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Il codice sarà valido fino al <span>{{expires_date}}</span>. L'ora è nel fuso orario UTC{{timezone}}.
</p>
<p style="margin-top: 34px;">
Cordiali saluti, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.confirmation_link, locale: ELocales.it },
      },
      create: {
        locale: ELocales.it,
        action: NotificationAction.confirmation_link,
        title: 'Link di Conferma',
        subject: 'Codice per confermare la tua email',
        content: `<p>
{{#given_name}}Ciao, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Ciao!{{/given_name}}
</p>
<p>
Hai ricevuto questa email perché la tua email è stata specificata in <span>{{app_name}}</span>.
</p>
<p>
Per confermare il tuo indirizzo email, inserisci il codice: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
O segui il <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>link</a>.
</p>
<p>
Il link e il codice saranno validi fino al <span>{{expires_date}}</span>. L'ora è nel fuso orario UTC {{timezone}}.
</p>
<p style="margin-top: 34px;">
Cordiali saluti, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: { action_locale: { action: NotificationAction.password_change, locale: ELocales.it } },
      create: {
        locale: ELocales.it,
        action: NotificationAction.password_change,
        title: 'Cambio Password',
        subject: 'La tua password è stata cambiata',
        content: `<p>
{{#given_name}}Ciao, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Ciao!{{/given_name}}
</p>
<p>
La tua password è stata cambiata nel servizio <span style="color: {{accent}}">{{link_name}}</span>.
</p>
<p>
Nome utente - <span style="font-size: 16px; font-weight:600">{{login}}</span>
</p>
<p>
Password - <span style="font-size: 16px; font-weight:600">{{password}}</span>
</p>
<p>
<p style="margin-top: 34px;">
Cordiali saluti, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });

    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.password_recover, locale: ELocales.it },
      },
      create: {
        locale: ELocales.it,
        action: NotificationAction.password_recover,
        title: 'Richiesta di Recupero Password',
        subject: 'Codice per recuperare la tua password',
        content: `<p>
{{#given_name}}Ciao, <b>{{given_name}}</b>!{{/given_name}}
{{^given_name}}Ciao!{{/given_name}}
</p>
<p>
Hai richiesto il recupero della password per <span>{{app_name}}</span>.
</p>
<p>
Per recuperare la tua password, inserisci il codice: <b><span style=color:{{accent}}>{{code}}</span></b>
</p>
<p>
Il codice sarà valido fino al <span>{{expires_date}}</span>. L'ora è nel fuso orario UTC{{timezone}}.
</p>
<p style="margin-top: 34px;">
Cordiali saluti, <span>{{project_name}}</span>
</p>`,
      },
      update: {},
    });
    await prisma.emailTemplates.upsert({
      where: {
        action_locale: { action: NotificationAction.invite, locale: ELocales.it },
      },
      create: {
        locale: ELocales.it,
        action: NotificationAction.invite,
        title: 'Invito',
        subject: 'Invito a diventare membro di {{app_name}}',
        content: `<p>
Buongiorno!
</p>
<p>
Sei invitato a diventare membro del servizio {{app_name}}.
</p>
<p>
Per un accesso rapido al servizio, segui il <a href={{{reference}}} style="color:{{accent}}; text-decoration:none";>link</a>.
</p>
<p>
Oppure accetta l'invito nel <a href={{{link_name}}} style="color:{{accent}}; text-decoration:none";>tuo account personale</a>.
</p>
</p>`,
      },
      update: {},
    });
    //#endregion
  }
}
