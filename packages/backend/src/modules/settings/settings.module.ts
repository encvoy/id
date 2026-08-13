import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DELETE_PROFILE_AFTER_DAYS } from 'src/constants';
import { OidcModule } from '../oidc/oidc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsClientRulesValidationsController } from './settings-client-rules-validations.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { prisma } from '../prisma';
import { ESettingsNames, TLocalizedTextDto } from './settings.dto';
import { ELocales } from 'src/enums';
import { isLocalizedTextValue } from 'src/utils/localized-text-dto';

const DEFAULT_SYSTEM_STYLE = {
  component: {
    borderRadius: '0px',
  },
  button: {
    borderRadius: '0px',
  },
  contentPosition: 'start',
  surfaceBlock: {
    borderWidth: '1px',
    hideBorder: false,
    boxShadow: 'none',
  },
};

const DEFAULT_THEME_PALETTE = {
  primary: {
    main: '#4C6AD4',
    contrastText: '#fff',
  },
  secondary: {
    main: '#ecedf0',
    contrastText: '#0B1641',
  },
  text: {
    primary: '#0B1641',
    secondary: '#858BA0',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F9FAFB',
  },
  action: {
    hover: '#f1f1f4',
    disabled: '#ECEDF0',
    selected: '#cdced3',
  },
  divider: '#E7E8EC',
  error: {
    main: '#E7000B',
  },
};

@Module({
  imports: [PrismaModule, forwardRef(() => OidcModule), RepositoryModule],
  controllers: [SettingsController, SettingsClientRulesValidationsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}

  private getInitialCopyrightValue(): TLocalizedTextDto {
    const copyrightEnv = process.env['COPYRIGHT'];
    if (!copyrightEnv) return {};

    try {
      const parsedValue = JSON.parse(copyrightEnv);

      if (
        isLocalizedTextValue(parsedValue, {
          allowedLocales: Object.values(ELocales),
        })
      ) {
        return parsedValue;
      }

      console.warn(
        'COPYRIGHT env has invalid localized text format, fallback to empty settings value',
      );
      return {};
    } catch (error) {
      console.warn(
        `Invalid COPYRIGHT env JSON, fallback to empty settings value: ${error['message']}`,
      );
      return {};
    }
  }

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
        value: { default_language: ELocales.ru },
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.copyright,
      },
      create: {
        name: ESettingsNames.copyright,
        title: 'Copyright settings',
        value: this.getInitialCopyrightValue(),
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.manual_url,
      },
      create: {
        name: ESettingsNames.manual_url,
        title: 'Manual URL',
        value: process.env['MANUAL_URL'] || '',
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.prohibit_restore_deleted_users,
      },
      create: {
        name: ESettingsNames.prohibit_restore_deleted_users,
        title: 'Prohibit restoring deleted users',
        value: false,
        public: false,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.delete_profile_after_days,
      },
      create: {
        name: ESettingsNames.delete_profile_after_days,
        title: 'Deleted user cleanup retention in days',
        value: Number.isInteger(DELETE_PROFILE_AFTER_DAYS) ? DELETE_PROFILE_AFTER_DAYS : 30,
        public: false,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.log_retention_days,
      },
      create: {
        name: ESettingsNames.log_retention_days,
        title: 'Log retention period in days',
        value: 365,
        public: false,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.system_style,
      },
      create: {
        name: ESettingsNames.system_style,
        title: 'System style settings',
        value: JSON.stringify(DEFAULT_SYSTEM_STYLE),
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.theme_light,
      },
      create: {
        name: ESettingsNames.theme_light,
        title: 'Light theme palette',
        value: JSON.stringify(DEFAULT_THEME_PALETTE),
        public: true,
      },
      update: {},
    });

    await prisma.settings.upsert({
      where: {
        name: ESettingsNames.theme_dark,
      },
      create: {
        name: ESettingsNames.theme_dark,
        title: 'Dark theme palette',
        value: JSON.stringify(DEFAULT_THEME_PALETTE),
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
        name: 'winston',
      },
      create: {
        name: 'winston',
        title: 'Winston logging settings',
        value: {
          enabled: true,
          export_enabled: false,
          export_provider: 'stdout',
          export_url: '',
          export_api_key: '',
          audit_export_enabled: false,
          redact_headers: 'authorization,cookie,set-cookie',
          service_name: 'backend',
          log_level: 'info',
        },
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
        value: 'login phone_number',
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

    //#region Profile fields
    const profileFieldSeeds = [
      {
        key: 'email',
        title: {
          'ru-RU': 'Email',
          'en-US': 'Email',
          'es-ES': 'Email',
          'fr-FR': 'Email',
          'de-DE': 'Email',
          'it-IT': 'Email',
        },
        editable: true,
        required: false,
        active: true,
        unique: true,
      },
      {
        key: 'given_name',
        title: {
          'ru-RU': 'Имя',
          'en-US': 'Given name',
          'es-ES': 'Nombre',
          'fr-FR': 'Prénom',
          'de-DE': 'Vorname',
          'it-IT': 'Nome',
        },
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      {
        key: 'sub',
        title: {
          'ru-RU': 'Sub',
          'en-US': 'Sub',
          'es-ES': 'Sub',
          'fr-FR': 'Sub',
          'de-DE': 'Sub',
          'it-IT': 'Sub',
        },
        editable: false,
        required: true,
        active: true,
        unique: true,
      },
      {
        key: 'login',
        title: {
          'ru-RU': 'Логин',
          'en-US': 'Login',
          'es-ES': 'Inicio de sesión',
          'fr-FR': 'Identifiant',
          'de-DE': 'Anmeldename',
          'it-IT': 'Login',
        },
        editable: true,
        required: true,
        active: true,
        unique: true,
      },
      {
        key: 'family_name',
        title: {
          'ru-RU': 'Фамилия',
          'en-US': 'Family name',
          'es-ES': 'Apellido',
          'fr-FR': 'Nom de famille',
          'de-DE': 'Nachname',
          'it-IT': 'Cognome',
        },
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      {
        key: 'phone_number',
        title: {
          'ru-RU': 'Номер телефона',
          'en-US': 'Phone number',
          'es-ES': 'Número de teléfono',
          'fr-FR': 'Numéro de téléphone',
          'de-DE': 'Telefonnummer',
          'it-IT': 'Numero di telefono',
        },
        editable: true,
        required: false,
        active: true,
        unique: true,
      },
      {
        key: 'birthdate',
        title: {
          'ru-RU': 'Дата рождения',
          'en-US': 'Birthdate',
          'es-ES': 'Fecha de nacimiento',
          'fr-FR': 'Date de naissance',
          'de-DE': 'Geburtsdatum',
          'it-IT': 'Data di nascita',
        },
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      {
        key: 'nickname',
        title: {
          'ru-RU': 'Публичное имя',
          'en-US': 'Nickname',
          'es-ES': 'Apodo',
          'fr-FR': 'Pseudo',
          'de-DE': 'Spitzname',
          'it-IT': 'Soprannome',
        },
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      {
        key: 'picture',
        title: {
          'ru-RU': 'Фото',
          'en-US': 'Picture',
          'es-ES': 'Foto',
          'fr-FR': 'Photo',
          'de-DE': 'Bild',
          'it-IT': 'Foto',
        },
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
      {
        key: 'password',
        title: {
          'ru-RU': 'Пароль',
          'en-US': 'Password',
          'es-ES': 'Contraseña',
          'fr-FR': 'Mot de passe',
          'de-DE': 'Passwort',
          'it-IT': 'Password',
        },
        editable: true,
        required: true,
        active: true,
        unique: false,
      },
      {
        key: 'data_processing_agreement',
        title: {
          'ru-RU': 'Согласие на обработку данных',
          'en-US': 'Data processing agreement',
          'es-ES': 'Acuerdo de procesamiento de datos',
          'fr-FR': 'Accord de traitement des données',
          'de-DE': 'Datenschutzvereinbarung',
          'it-IT': 'Accordo di trattamento dei dati',
        },
        editable: true,
        required: false,
        active: true,
        unique: false,
      },
    ];

    for (const field of profileFieldSeeds) {
      await prisma.profileField.upsert({
        where: {
          key: field.key,
        },
        create: field,
        update: {
          title: field.title,
          editable: field.editable,
          required: field.required,
          active: field.active,
          unique: field.unique,
        },
      });
    }
    //#endregion
  }
}
