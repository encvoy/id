import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { OidcModule } from '../oidc/oidc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { prisma } from '../prisma';
import { ESettingsNames } from './settings.dto';
import { ELocales } from 'src/enums';

@Module({
  imports: [PrismaModule, forwardRef(() => OidcModule), RepositoryModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
  async onModuleInit() {
    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.two_factor_authentication,
      },
      create: {
        name: ESettingsNames.two_factor_authentication,
        title: 'Two-factor authentication settings',
        value: { available_provider_ids: [], controlled_methods: [] },
        public: false,
      },
      update: {},
    });

    // TODO delete for github
    const i18nSettings = await prisma.settings.findFirst({ where: { name: ESettingsNames.i18n } });
    const userCount = await prisma.user.count();
    if (!i18nSettings && userCount > 2) {
      await prisma.settings.create({
        data: {
          name: ESettingsNames.i18n,
          title: 'Internationalization settings',
          value: { default_language: ELocales.ru },
          public: true,
        },
      });
    }

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.i18n,
      },
      create: {
        name: ESettingsNames.i18n,
        title: 'Internationalization settings',
        value: { default_language: ELocales.en },
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.ignore_required_fields_for_clients,
      },
      create: {
        name: ESettingsNames.ignore_required_fields_for_clients,
        title: 'Ignore required fields for clients',
        value: false,
        public: false,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.data_processing_agreement,
      },
      create: {
        name: ESettingsNames.data_processing_agreement,
        title: 'Data processing agreement',
        value: '',
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.prohibit_identifier_binding,
      },
      create: {
        name: ESettingsNames.prohibit_identifier_binding,
        title: 'Prohibit identifier binding',
        value: false,
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.authorize_only_admins,
      },
      create: {
        name: ESettingsNames.authorize_only_admins,
        title: 'Authorize only admins',
        value: false,
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.registration_policy,
      },
      create: {
        name: ESettingsNames.registration_policy,
        title: 'Registration policy',
        value: 'allowed',
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.default_public_profile_claims_gravatar,
      },
      create: {
        name: ESettingsNames.default_public_profile_claims_gravatar,
        title: 'Default public profile claims (Gravatar)',
        value: '',
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.default_public_profile_claims_oauth,
      },
      create: {
        name: ESettingsNames.default_public_profile_claims_oauth,
        title: 'Default public profile claims (OAuth)',
        value: 'picture nickname',
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: 'sentry',
      },
      create: {
        name: 'sentry',
        title: 'Sentry settings',
        value: { dsn: '', enabled: false, user_id: '' },
        public: false,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.allowed_login_fields,
      },
      create: {
        name: ESettingsNames.allowed_login_fields,
        title: 'Allowed login fields',
        value: 'email login phone_number',
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.allowed_login_fields,
      },
      create: {
        name: ESettingsNames.allowed_login_fields,
        title: 'Allowed login fields',
        value: 'email login phone_number',
        public: true,
      },
      update: {},
    });
    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.two_factor_authentication,
      },
      create: {
        name: ESettingsNames.two_factor_authentication,
        title: 'Two-factor authentication settings',
        value: { controlled_methods: [], available_provider_ids: [] },
        public: false,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: 'catalog',
      },
      create: {
        name: 'catalog',
        title: 'Catalog settings',
        value: false,
        public: false,
      },
      update: {},
    });

    //#region Rules
    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'email', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'email',
        editable: true,
        required: true,
        active: true,
        unique: true,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'given_name', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'given_name',
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'sub', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'sub',
        editable: false,
        required: true,
        active: true,
        unique: true,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'login', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'login',
        editable: true,
        required: true,
        active: true,
        unique: true,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'family_name', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'family_name',
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'phone_number', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'phone_number',
        editable: true,
        required: false,
        active: true,
        unique: true,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'birthdate', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'birthdate',
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'nickname', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'nickname',
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'picture', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'picture',
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'password', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'password',
        editable: true,
        required: true,
        active: true,
        unique: false,
      },
      update: {},
    });

    await prisma.rule.upsert({
      where: {
        target_field_name: { field_name: 'data_processing_agreement', target: 'USER' },
      },
      create: {
        target: 'USER',
        field_name: 'data_processing_agreement',
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      update: {},
    });
    //#endregion
  }
}
