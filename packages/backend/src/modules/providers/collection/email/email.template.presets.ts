import { ELocales } from 'src/enums';
import { NotificationAction } from './email.types';

type TActionPresetCopy = {
  headline?: string;
  lead: string;
  info: string;
  instruction?: string;
  buttonLabel?: string;
  buttonHref?: 'reference' | 'dashboard_url';
  note?: string;
};

type TLocalePresetCopy = {
  greeting: string;
  greetingFallback: string;
  footerIgnore: string;
  footerSupportPrefix: string;
  footerSupportLinkText: string;
  actions: Record<NotificationAction, TActionPresetCopy>;
};

const APP_DISPLAY_NAME =
  '{{#app_name}}{{app_name}}{{/app_name}}{{^app_name}}{{project_name}}{{/app_name}}';

const VARIANT_2_PRESET_COPY: Record<ELocales, TLocalePresetCopy> = {
  [ELocales.ru]: {
    greeting: 'Здравствуйте, {{given_name}}!',
    greetingFallback: 'Здравствуйте!',
    footerIgnore: 'Если это письмо пришло вам по ошибке, просто проигнорируйте его.',
    footerSupportPrefix: 'По всем вопросам вы можете обратиться в ',
    footerSupportLinkText: 'службу поддержки',
    actions: {
      [NotificationAction.account_create]: {
        headline: `Ваш аккаунт в ${APP_DISPLAY_NAME} готов`,
        lead: 'Для вас создан аккаунт в {{project_name}}.',
        info:
          '<strong>Логин</strong><br />{{login}}<br /><br /><strong>Пароль</strong><br />{{password}}',
        instruction: 'Нажмите кнопку, чтобы открыть личный кабинет:',
        buttonLabel: 'Открыть личный кабинет',
        buttonHref: 'dashboard_url',
        note: 'После входа вы сможете изменить пароль в настройках профиля.',
      },
      [NotificationAction.confirmation_code]: {
        headline: `Подтвердите email в ${APP_DISPLAY_NAME}`,
        lead: 'Вы получили это письмо, потому что адрес электронной почты был указан в {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Код подтверждения</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Введите код, чтобы подтвердить адрес электронной почты.',
        note: 'Код действует до {{expires_date}}. Время указано в UTC{{timezone}}.',
      },
      [NotificationAction.confirmation_link]: {
        headline: `Подтвердите email в ${APP_DISPLAY_NAME}`,
        lead: 'Вы получили это письмо, потому что адрес электронной почты был указан в {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Код подтверждения</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Нажмите кнопку, чтобы подтвердить адрес электронной почты:',
        buttonLabel: 'Подтвердить email',
        buttonHref: 'reference',
        note: 'Ссылка и код действуют до {{expires_date}}. Время указано в UTC{{timezone}}.',
      },
      [NotificationAction.password_change]: {
        headline: `Пароль в ${APP_DISPLAY_NAME} изменён`,
        lead: 'Пароль для аккаунта в {{project_name}} был изменён.',
        info:
          '<strong>Логин</strong><br />{{login}}<br /><br /><strong>Новый пароль</strong><br />{{password}}',
        instruction: 'Если это были вы, откройте личный кабинет:',
        buttonLabel: 'Открыть личный кабинет',
        buttonHref: 'dashboard_url',
        note: 'Если вы не меняли пароль, свяжитесь со службой поддержки.',
      },
      [NotificationAction.password_recover]: {
        headline: `Восстановление пароля в ${APP_DISPLAY_NAME}`,
        lead: 'Вы запросили восстановление пароля для {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Код восстановления</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Введите код, чтобы продолжить восстановление пароля.',
        note: 'Код действует до {{expires_date}}. Время указано в UTC{{timezone}}.',
      },
      [NotificationAction.invite]: {
        headline: `Вас пригласили в ${APP_DISPLAY_NAME}`,
        lead: 'Вас пригласили в {{app_name}}.',
        info: '{{app_name}} — приложение, к которому вам открывают доступ.',
        instruction: 'Нажмите кнопку, чтобы принять приглашение:',
        buttonLabel: 'Принять приглашение',
        buttonHref: 'reference',
        note:
          'Или примите приглашение в <a href="{{{dashboard_url}}}" style="color:#232631;font-weight:600;text-decoration:none;">личном кабинете</a> {{project_name}}.',
      },
    },
  },
  [ELocales.en]: {
    greeting: 'Hello, {{given_name}}!',
    greetingFallback: 'Hello!',
    footerIgnore: 'If you received this email by mistake, simply ignore it.',
    footerSupportPrefix: 'If you have any questions, please contact ',
    footerSupportLinkText: 'support',
    actions: {
      [NotificationAction.account_create]: {
        headline: `Your account in ${APP_DISPLAY_NAME} is ready`,
        lead: 'An account has been created for you in {{project_name}}.',
        info:
          '<strong>Login</strong><br />{{login}}<br /><br /><strong>Password</strong><br />{{password}}',
        instruction: 'Click the button to open your account:',
        buttonLabel: 'Open account',
        buttonHref: 'dashboard_url',
        note: 'After signing in, you can change the password in your profile settings.',
      },
      [NotificationAction.confirmation_code]: {
        headline: `Confirm your email in ${APP_DISPLAY_NAME}`,
        lead: 'You received this email because the email address was specified in {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Confirmation code</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Enter the code to confirm your email address.',
        note: 'The code is valid until {{expires_date}}. Time is shown in UTC{{timezone}}.',
      },
      [NotificationAction.confirmation_link]: {
        headline: `Confirm your email in ${APP_DISPLAY_NAME}`,
        lead: 'You received this email because the email address was specified in {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Confirmation code</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Click the button to confirm your email address:',
        buttonLabel: 'Confirm email',
        buttonHref: 'reference',
        note: 'The link and code are valid until {{expires_date}}. Time is shown in UTC{{timezone}}.',
      },
      [NotificationAction.password_change]: {
        headline: `Your password in ${APP_DISPLAY_NAME} has been changed`,
        lead: 'The password for your {{project_name}} account has been changed.',
        info:
          '<strong>Login</strong><br />{{login}}<br /><br /><strong>New password</strong><br />{{password}}',
        instruction: 'If this was you, open your account:',
        buttonLabel: 'Open account',
        buttonHref: 'dashboard_url',
        note: 'If you did not change the password, please contact support.',
      },
      [NotificationAction.password_recover]: {
        headline: `Password recovery for ${APP_DISPLAY_NAME}`,
        lead: 'You requested password recovery for {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Recovery code</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Enter the code to continue password recovery.',
        note: 'The code is valid until {{expires_date}}. Time is shown in UTC{{timezone}}.',
      },
      [NotificationAction.invite]: {
        headline: `You have been invited to ${APP_DISPLAY_NAME}`,
        lead: 'You have been invited to {{app_name}}.',
        info: '{{app_name}} is the application you are being granted access to.',
        instruction: 'Click the button to accept the invitation:',
        buttonLabel: 'Accept invitation',
        buttonHref: 'reference',
        note:
          'Or accept the invitation in your <a href="{{{dashboard_url}}}" style="color:#232631;font-weight:600;text-decoration:none;">personal account</a> for {{project_name}}.',
      },
    },
  },
  [ELocales.es]: {
    greeting: 'Hola, {{given_name}}!',
    greetingFallback: 'Hola!',
    footerIgnore: 'Si recibiste este correo por error, simplemente ignóralo.',
    footerSupportPrefix: 'Si tienes alguna pregunta, puedes contactar con ',
    footerSupportLinkText: 'el soporte',
    actions: {
      [NotificationAction.account_create]: {
        headline: `Tu cuenta en ${APP_DISPLAY_NAME} está lista`,
        lead: 'Se ha creado una cuenta para ti en {{project_name}}.',
        info:
          '<strong>Usuario</strong><br />{{login}}<br /><br /><strong>Contraseña</strong><br />{{password}}',
        instruction: 'Haz clic en el botón para abrir tu cuenta:',
        buttonLabel: 'Abrir cuenta',
        buttonHref: 'dashboard_url',
        note: 'Después de iniciar sesión podrás cambiar la contraseña en tu perfil.',
      },
      [NotificationAction.confirmation_code]: {
        headline: `Confirma tu correo en ${APP_DISPLAY_NAME}`,
        lead: 'Recibiste este correo porque la dirección de correo se indicó en {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Código de confirmación</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Introduce el código para confirmar tu dirección de correo.',
        note: 'El código es válido hasta {{expires_date}}. La hora se muestra en UTC{{timezone}}.',
      },
      [NotificationAction.confirmation_link]: {
        headline: `Confirma tu correo en ${APP_DISPLAY_NAME}`,
        lead: 'Recibiste este correo porque la dirección de correo se indicó en {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Código de confirmación</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Haz clic en el botón para confirmar tu correo:',
        buttonLabel: 'Confirmar correo',
        buttonHref: 'reference',
        note: 'El enlace y el código son válidos hasta {{expires_date}}. La hora se muestra en UTC{{timezone}}.',
      },
      [NotificationAction.password_change]: {
        headline: `Tu contraseña en ${APP_DISPLAY_NAME} ha sido cambiada`,
        lead: 'La contraseña de tu cuenta en {{project_name}} ha sido cambiada.',
        info:
          '<strong>Usuario</strong><br />{{login}}<br /><br /><strong>Nueva contraseña</strong><br />{{password}}',
        instruction: 'Si fuiste tú, abre tu cuenta:',
        buttonLabel: 'Abrir cuenta',
        buttonHref: 'dashboard_url',
        note: 'Si no cambiaste la contraseña, contacta con soporte.',
      },
      [NotificationAction.password_recover]: {
        headline: `Recuperación de contraseña para ${APP_DISPLAY_NAME}`,
        lead: 'Solicitaste recuperar la contraseña de {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Código de recuperación</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Introduce el código para continuar con la recuperación de la contraseña.',
        note: 'El código es válido hasta {{expires_date}}. La hora se muestra en UTC{{timezone}}.',
      },
      [NotificationAction.invite]: {
        headline: `Te han invitado a ${APP_DISPLAY_NAME}`,
        lead: 'Te han invitado a {{app_name}}.',
        info: '{{app_name}} es la aplicación a la que se te está dando acceso.',
        instruction: 'Haz clic en el botón para aceptar la invitación:',
        buttonLabel: 'Aceptar invitación',
        buttonHref: 'reference',
        note:
          'O acepta la invitación en tu <a href="{{{dashboard_url}}}" style="color:#232631;font-weight:600;text-decoration:none;">cuenta personal</a> de {{project_name}}.',
      },
    },
  },
  [ELocales.fr]: {
    greeting: 'Bonjour, {{given_name}}!',
    greetingFallback: 'Bonjour!',
    footerIgnore: "Si vous avez reçu cet e-mail par erreur, ignorez-le simplement.",
    footerSupportPrefix: 'Pour toute question, vous pouvez contacter ',
    footerSupportLinkText: 'le support',
    actions: {
      [NotificationAction.account_create]: {
        headline: `Votre compte dans ${APP_DISPLAY_NAME} est prêt`,
        lead: 'Un compte a été créé pour vous dans {{project_name}}.',
        info:
          '<strong>Identifiant</strong><br />{{login}}<br /><br /><strong>Mot de passe</strong><br />{{password}}',
        instruction: 'Cliquez sur le bouton pour ouvrir votre compte :',
        buttonLabel: 'Ouvrir le compte',
        buttonHref: 'dashboard_url',
        note: 'Après connexion, vous pourrez modifier le mot de passe dans votre profil.',
      },
      [NotificationAction.confirmation_code]: {
        headline: `Confirmez votre e-mail dans ${APP_DISPLAY_NAME}`,
        lead: "Vous recevez cet e-mail parce que l'adresse e-mail a été indiquée dans {{app_name}}.",
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Code de confirmation</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: "Saisissez le code pour confirmer votre adresse e-mail.",
        note: "Le code est valable jusqu'au {{expires_date}}. L'heure est indiquée en UTC{{timezone}}.",
      },
      [NotificationAction.confirmation_link]: {
        headline: `Confirmez votre e-mail dans ${APP_DISPLAY_NAME}`,
        lead: "Vous recevez cet e-mail parce que l'adresse e-mail a été indiquée dans {{app_name}}.",
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Code de confirmation</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Cliquez sur le bouton pour confirmer votre adresse e-mail :',
        buttonLabel: "Confirmer l'e-mail",
        buttonHref: 'reference',
        note: "Le lien et le code sont valables jusqu'au {{expires_date}}. L'heure est indiquée en UTC{{timezone}}.",
      },
      [NotificationAction.password_change]: {
        headline: `Votre mot de passe dans ${APP_DISPLAY_NAME} a été modifié`,
        lead: 'Le mot de passe de votre compte {{project_name}} a été modifié.',
        info:
          '<strong>Identifiant</strong><br />{{login}}<br /><br /><strong>Nouveau mot de passe</strong><br />{{password}}',
        instruction: 'Si cette action vient de vous, ouvrez votre compte :',
        buttonLabel: 'Ouvrir le compte',
        buttonHref: 'dashboard_url',
        note: "Si vous n'avez pas modifié le mot de passe, contactez le support.",
      },
      [NotificationAction.password_recover]: {
        headline: `Récupération du mot de passe pour ${APP_DISPLAY_NAME}`,
        lead: 'Vous avez demandé la réinitialisation du mot de passe pour {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Code de récupération</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Saisissez le code pour poursuivre la récupération du mot de passe.',
        note: "Le code est valable jusqu'au {{expires_date}}. L'heure est indiquée en UTC{{timezone}}.",
      },
      [NotificationAction.invite]: {
        headline: `Vous avez été invité à rejoindre ${APP_DISPLAY_NAME}`,
        lead: 'Vous avez été invité à rejoindre {{app_name}}.',
        info: "{{app_name}} est l'application à laquelle vous recevez un accès.",
        instruction: "Cliquez sur le bouton pour accepter l'invitation :",
        buttonLabel: "Accepter l'invitation",
        buttonHref: 'reference',
        note:
          'Ou acceptez l’invitation dans votre <a href="{{{dashboard_url}}}" style="color:#232631;font-weight:600;text-decoration:none;">espace personnel</a> {{project_name}}.',
      },
    },
  },
  [ELocales.de]: {
    greeting: 'Hallo, {{given_name}}!',
    greetingFallback: 'Hallo!',
    footerIgnore: 'Wenn Sie diese E-Mail irrtümlich erhalten haben, ignorieren Sie sie einfach.',
    footerSupportPrefix: 'Bei Fragen wenden Sie sich bitte an ',
    footerSupportLinkText: 'den Support',
    actions: {
      [NotificationAction.account_create]: {
        headline: `Ihr Konto in ${APP_DISPLAY_NAME} ist bereit`,
        lead: 'Für Sie wurde ein Konto in {{project_name}} erstellt.',
        info:
          '<strong>Login</strong><br />{{login}}<br /><br /><strong>Passwort</strong><br />{{password}}',
        instruction: 'Klicken Sie auf die Schaltfläche, um Ihr Konto zu öffnen:',
        buttonLabel: 'Konto öffnen',
        buttonHref: 'dashboard_url',
        note: 'Nach der Anmeldung können Sie das Passwort in Ihrem Profil ändern.',
      },
      [NotificationAction.confirmation_code]: {
        headline: `Bestätigen Sie Ihre E-Mail in ${APP_DISPLAY_NAME}`,
        lead: 'Sie erhalten diese E-Mail, weil die E-Mail-Adresse in {{app_name}} angegeben wurde.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Bestätigungscode</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Geben Sie den Code ein, um Ihre E-Mail-Adresse zu bestätigen.',
        note: 'Der Code ist bis {{expires_date}} gültig. Die Zeit ist in UTC{{timezone}} angegeben.',
      },
      [NotificationAction.confirmation_link]: {
        headline: `Bestätigen Sie Ihre E-Mail in ${APP_DISPLAY_NAME}`,
        lead: 'Sie erhalten diese E-Mail, weil die E-Mail-Adresse in {{app_name}} angegeben wurde.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Bestätigungscode</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Klicken Sie auf die Schaltfläche, um Ihre E-Mail-Adresse zu bestätigen:',
        buttonLabel: 'E-Mail bestätigen',
        buttonHref: 'reference',
        note: 'Link und Code sind bis {{expires_date}} gültig. Die Zeit ist in UTC{{timezone}} angegeben.',
      },
      [NotificationAction.password_change]: {
        headline: `Ihr Passwort in ${APP_DISPLAY_NAME} wurde geändert`,
        lead: 'Das Passwort für Ihr Konto in {{project_name}} wurde geändert.',
        info:
          '<strong>Login</strong><br />{{login}}<br /><br /><strong>Neues Passwort</strong><br />{{password}}',
        instruction: 'Wenn Sie das waren, öffnen Sie Ihr Konto:',
        buttonLabel: 'Konto öffnen',
        buttonHref: 'dashboard_url',
        note: 'Wenn Sie das Passwort nicht geändert haben, wenden Sie sich an den Support.',
      },
      [NotificationAction.password_recover]: {
        headline: `Passwortwiederherstellung für ${APP_DISPLAY_NAME}`,
        lead: 'Sie haben die Passwortwiederherstellung für {{app_name}} angefordert.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Wiederherstellungscode</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Geben Sie den Code ein, um mit der Passwortwiederherstellung fortzufahren.',
        note: 'Der Code ist bis {{expires_date}} gültig. Die Zeit ist in UTC{{timezone}} angegeben.',
      },
      [NotificationAction.invite]: {
        headline: `Sie wurden zu ${APP_DISPLAY_NAME} eingeladen`,
        lead: 'Sie wurden zu {{app_name}} eingeladen.',
        info: '{{app_name}} ist die Anwendung, für die Ihnen Zugriff gewährt wird.',
        instruction: 'Klicken Sie auf die Schaltfläche, um die Einladung anzunehmen:',
        buttonLabel: 'Einladung annehmen',
        buttonHref: 'reference',
        note:
          'Oder nehmen Sie die Einladung in Ihrem <a href="{{{dashboard_url}}}" style="color:#232631;font-weight:600;text-decoration:none;">persönlichen Konto</a> für {{project_name}} an.',
      },
    },
  },
  [ELocales.it]: {
    greeting: 'Ciao, {{given_name}}!',
    greetingFallback: 'Ciao!',
    footerIgnore: 'Se hai ricevuto questa email per errore, ignorala semplicemente.',
    footerSupportPrefix: 'Per qualsiasi domanda puoi contattare ',
    footerSupportLinkText: 'il supporto',
    actions: {
      [NotificationAction.account_create]: {
        headline: `Il tuo account in ${APP_DISPLAY_NAME} è pronto`,
        lead: 'Per te è stato creato un account in {{project_name}}.',
        info:
          '<strong>Login</strong><br />{{login}}<br /><br /><strong>Password</strong><br />{{password}}',
        instruction: 'Fai clic sul pulsante per aprire il tuo account:',
        buttonLabel: 'Apri account',
        buttonHref: 'dashboard_url',
        note: 'Dopo l’accesso potrai cambiare la password nelle impostazioni del profilo.',
      },
      [NotificationAction.confirmation_code]: {
        headline: `Conferma la tua email in ${APP_DISPLAY_NAME}`,
        lead: "Hai ricevuto questa email perché l'indirizzo email è stato indicato in {{app_name}}.",
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Codice di conferma</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: "Inserisci il codice per confermare l'indirizzo email.",
        note: "Il codice è valido fino a {{expires_date}}. L'orario è indicato in UTC{{timezone}}.",
      },
      [NotificationAction.confirmation_link]: {
        headline: `Conferma la tua email in ${APP_DISPLAY_NAME}`,
        lead: "Hai ricevuto questa email perché l'indirizzo email è stato indicato in {{app_name}}.",
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Codice di conferma</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: "Fai clic sul pulsante per confermare l'indirizzo email:",
        buttonLabel: 'Conferma email',
        buttonHref: 'reference',
        note: "Il link e il codice sono validi fino a {{expires_date}}. L'orario è indicato in UTC{{timezone}}.",
      },
      [NotificationAction.password_change]: {
        headline: `La tua password in ${APP_DISPLAY_NAME} è stata modificata`,
        lead: 'La password del tuo account {{project_name}} è stata modificata.',
        info:
          '<strong>Login</strong><br />{{login}}<br /><br /><strong>Nuova password</strong><br />{{password}}',
        instruction: 'Se sei stato tu, apri il tuo account:',
        buttonLabel: 'Apri account',
        buttonHref: 'dashboard_url',
        note: 'Se non hai modificato la password, contatta il supporto.',
      },
      [NotificationAction.password_recover]: {
        headline: `Recupero password per ${APP_DISPLAY_NAME}`,
        lead: 'Hai richiesto il recupero della password per {{app_name}}.',
        info:
          '<span style="font-size:16px;line-height:24px;color:#6D6E78;">Codice di recupero</span><br /><span style="display:inline-block;margin-top:12px;font-size:40px;line-height:44px;font-weight:700;letter-spacing:4px;color:#232631;">{{code}}</span>',
        instruction: 'Inserisci il codice per continuare con il recupero della password.',
        note: "Il codice è valido fino a {{expires_date}}. L'orario è indicato in UTC{{timezone}}.",
      },
      [NotificationAction.invite]: {
        headline: `Hai ricevuto un invito a ${APP_DISPLAY_NAME}`,
        lead: 'Hai ricevuto un invito a {{app_name}}.',
        info: "{{app_name}} è l'applicazione a cui ti viene concesso l'accesso.",
        instruction: "Fai clic sul pulsante per accettare l'invito:",
        buttonLabel: "Accetta invito",
        buttonHref: 'reference',
        note:
          'Oppure accetta l’invito nel tuo <a href="{{{dashboard_url}}}" style="color:#232631;font-weight:600;text-decoration:none;">account personale</a> di {{project_name}}.',
      },
    },
  },
};

const renderButton = (buttonLabel?: string, buttonHref?: 'reference' | 'dashboard_url') => {
  if (!buttonLabel || !buttonHref) {
    return '';
  }

  const href = buttonHref === 'reference' ? '{{{reference}}}' : '{{{dashboard_url}}}';

  return `
    <tr>
      <td style="padding:0 40px 0 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td align="center" bgcolor="#D44732" style="border-radius:40px;">
              <a href="${href}" target="_blank" style="display:inline-block;padding:20px 44px;font-size:18px;line-height:28px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:40px;">
                ${buttonLabel}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
};

const getVariant3Markup = (content: string) =>
  content.replace(/#6D6E78/gi, '#A7ABB6').replace(/#232631/gi, '#FFFFFF');

export const getVariant2EmailTemplatePreset = (
  locale: ELocales,
  action: NotificationAction,
) => {
  const localeCopy = VARIANT_2_PRESET_COPY[locale] || VARIANT_2_PRESET_COPY[ELocales.ru];
  const actionCopy = localeCopy.actions[action];

  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{project_name}}</title>
  </head>
  <body style="margin:0;padding:0;background:#6F7078;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#6F7078">
      <tr>
        <td style="padding:24px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ECECF1" style="width:100%;background:#ECECF1;">
            <tr>
              <td align="center" style="padding:52px 0 34px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:580px;">
                  <tr>
                    <td width="68" height="68" align="center" valign="middle" bgcolor="#6D6E78" style="width:68px;height:68px;border-radius:18px;background:#6D6E78;">
                      <img src="{{{logo_url}}}" alt="" width="34" height="34" style="display:block;width:34px;height:34px;object-fit:contain;" />
                    </td>
                    <td width="18" style="width:18px;"></td>
                    <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:28px;line-height:36px;font-weight:600;color:#6D6E78;">
                      {{#app_name}}{{app_name}}{{/app_name}}{{^app_name}}{{project_name}}{{/app_name}}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 0 48px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#FFFFFF" style="width:100%;max-width:580px;background:#FFFFFF;border-radius:28px;box-shadow:0 18px 42px rgba(27,31,45,0.12);">
                  <tr>
                    <td style="padding:48px 40px 40px 40px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:28px;line-height:36px;font-weight:700;color:#232631;padding-bottom:28px;">
                            {{#given_name}}${localeCopy.greeting}{{/given_name}}{{^given_name}}${localeCopy.greetingFallback}{{/given_name}}
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:20px;line-height:32px;color:#232631;padding-bottom:28px;">
                            ${actionCopy.lead}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#E7E9EE" style="width:100%;background:#E7E9EE;border-radius:24px;">
                              <tr>
                                <td style="padding:28px 32px;font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:18px;line-height:30px;color:#232631;">
                                  ${actionCopy.info}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${
                          actionCopy.instruction
                            ? `<tr>
                          <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:20px;line-height:32px;color:#232631;padding-bottom:${actionCopy.buttonLabel ? '28px' : '20px'};">
                            ${actionCopy.instruction}
                          </td>
                        </tr>`
                            : ''
                        }
                        ${renderButton(actionCopy.buttonLabel, actionCopy.buttonHref)}
                        ${
                          actionCopy.note
                            ? `<tr>
                          <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:18px;line-height:30px;color:#232631;padding-top:${actionCopy.buttonLabel ? '28px' : '0'};">
                            ${actionCopy.note}
                          </td>
                        </tr>`
                            : ''
                        }
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 0 48px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:580px;">
                  <tr>
                    <td align="center" style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:14px;line-height:24px;color:#6D6E78;padding-bottom:6px;">
                      ${localeCopy.footerIgnore}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:14px;line-height:24px;color:#6D6E78;">
                      ${localeCopy.footerSupportPrefix}<a href="{{footer_contact_href}}" style="color:#D44732;text-decoration:none;">${localeCopy.footerSupportLinkText}</a>.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const getVariant3EmailTemplatePreset = (
  locale: ELocales,
  action: NotificationAction,
) => {
  const localeCopy = VARIANT_2_PRESET_COPY[locale] || VARIANT_2_PRESET_COPY[ELocales.ru];
  const actionCopy = localeCopy.actions[action];
  const headline = actionCopy.headline || actionCopy.lead;
  const info = getVariant3Markup(actionCopy.info);
  const note = actionCopy.note ? getVariant3Markup(actionCopy.note) : '';

  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{project_name}}</title>
  </head>
  <body style="margin:0;padding:0;background:#6F7078;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#6F7078">
      <tr>
        <td style="padding:24px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#121214" style="width:100%;max-width:580px;background:#121214;">
            <tr>
              <td style="padding:42px 44px 0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:26px;line-height:34px;font-weight:700;color:#FFFFFF;padding-right:20px;">
                      ${headline}
                    </td>
                    <td width="56" valign="middle" align="right" style="width:56px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right">
                        <tr>
                          <td width="56" height="56" align="center" valign="middle" bgcolor="#6D6E78" style="width:56px;height:56px;border-radius:16px;background:#6D6E78;">
                            <img src="{{{logo_url}}}" alt="" width="28" height="28" style="display:block;width:28px;height:28px;object-fit:contain;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 44px 0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-top:1px solid #2D3037;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 44px 0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:22px;line-height:32px;font-weight:500;color:#FFFFFF;padding-bottom:28px;">
                      {{#given_name}}${localeCopy.greeting}{{/given_name}}{{^given_name}}${localeCopy.greetingFallback}{{/given_name}}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:20px;line-height:32px;color:#FFFFFF;padding-bottom:28px;">
                      ${actionCopy.lead}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1F2125" style="width:100%;background:#1F2125;border-radius:22px;">
                        <tr>
                          <td style="padding:28px 32px;font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:18px;line-height:30px;color:#FFFFFF;">
                            ${info}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${
                    actionCopy.instruction
                      ? `<tr>
                    <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:20px;line-height:32px;color:#FFFFFF;padding-bottom:${actionCopy.buttonLabel ? '28px' : '20px'};">
                      ${actionCopy.instruction}
                    </td>
                  </tr>`
                      : ''
                  }
                  ${renderButton(actionCopy.buttonLabel, actionCopy.buttonHref)}
                  ${
                    note
                      ? `<tr>
                    <td style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:18px;line-height:30px;color:#FFFFFF;padding-top:${actionCopy.buttonLabel ? '28px' : '0'};">
                      ${note}
                    </td>
                  </tr>`
                      : ''
                  }
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 44px 0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-top:1px solid #2D3037;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 44px 42px 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:14px;line-height:24px;color:#A7ABB6;padding-bottom:6px;">
                      ${localeCopy.footerIgnore}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;font-size:14px;line-height:24px;color:#A7ABB6;">
                      ${localeCopy.footerSupportPrefix}<a href="{{footer_contact_href}}" style="color:#D44732;text-decoration:none;">${localeCopy.footerSupportLinkText}</a>.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
