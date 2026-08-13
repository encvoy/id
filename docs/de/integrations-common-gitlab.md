---
title: "GitLab-Integration mit {{projectName}} — Einrichten von Single Sign-On"
description: "Erfahren Sie, wie Sie Single Sign-On für GitLab über {{projectName}} einrichten: einfache Konfiguration, Datenschutz und bequemer Zugriff für alle Mitarbeiter des Unternehmens."
keywords:
  - GitLab-Integration mit {{projectName}}
  - GitLab {{projectName}}
  - GitLab SSO
  - GitLab Single Sign-On
  - SSO-Anmeldung bei GitLab
  - Single Sign-On in GitLab
  - GitLab-Authentifizierung
  - GitLab-Autorisierung
  - GitLab OAuth-Authentifizierung
  - Anmeldung bei GitLab über {{projectName}}
  - Konfiguration von GitLab mit {{projectName}}
  - Verbindung von GitLab mit {{projectName}}
  - Single Sign-On in gitlab
author: "Das {{projectName}} Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integration mit GitLab"
---

# So konfigurieren Sie die GitLab-Integration mit {{projectName}}

In dieser Anleitung erfahren Sie, wie Sie Single Sign-On (SSO) in **GitLab** über das **{{projectName}}**-System einrichten.

> 📌 [GitLab](https://about.gitlab.com/) ist eine webbasierte Plattform zur Verwaltung von Projekten und Software-Code-Repositories, basierend auf dem beliebten Versionskontrollsystem **Git**.

Die Einrichtung der Anmeldung über **{{projectName}}** besteht aus mehreren Schlüsselphasen, die in zwei verschiedenen Systemen durchgeführt werden.

- [Schritt 1. Anwendung erstellen](#step-1-create-application)
- [Schritt 2. GitLab-System konfigurieren](#step-2-configure-gitlab)
- [Schritt 3. Integration überprüfen](#step-3-verify-integration)

---

## Schritt 1. Anwendung erstellen { #step-1-create-application }

1. Melden Sie sich im **{{projectName}}**-System an.  
2. Erstellen Sie eine Anwendung mit den folgenden Einstellungen:

   - **Anwendungsadresse** - die Adresse Ihrer **GitLab**-Installation;  
   - **Redirect-URL \#1 (`Redirect_uri`)** - `<GitLab-Installationsadresse>/users/auth/oauth2_generic/callback`.  

    > 🔍 Weitere Details zum Erstellen von Anwendungen finden Sie in den [Anweisungen](./docs-10-common-app-settings.md#creating-application).

3. Öffnen Sie die [Anwendungseinstellungen](./docs-10-common-app-settings.md#editing-application) und kopieren Sie die Werte der folgenden Felder:

    - **Identifikator** (`Client_id`),
    - **Geheimschlüssel** (`client_secret`).

---

## Schritt 2. GitLab-System konfigurieren { #step-2-configure-gitlab }

Die Konfiguration der Benutzerautorisierung für den **GitLab**-Dienst über **{{projectName}}** erfolgt in der Konfigurationsdatei **GitLab gitlab.rb**, die sich im Konfigurationsordner des Dienstes (/config) befindet.  

1. Öffnen Sie die Konfigurationsdatei **gitlab.rb** im Bearbeitungsmodus und navigieren Sie zum Block **OmniAuth Settings**.  
2. Legen Sie die folgenden Werte für die Parameter fest:  

    ```bash
        gitlab_rails['omniauth_enabled'] = true  
        gitlab_rails['omniauth_allow_single_sign_on'] = ['oauth2_generic', '<{{projectName}}SystemName>']  
        gitlab_rails['omniauth_block_auto_created_users'] = false  

        Der Wert für gitlab_rails['omniauth_providers'] sollte wie folgt aussehen:  

        gitlab_rails['omniauth_providers'] = [  
        {  
        'name' => 'oauth2_generic',   
        'app_id' => '<Client_id der in {{projectName}} erstellten Anwendung>',  
        'app_secret' => '<Client_secret der in {{projectName}} erstellten Anwendung>',  
        'args' => {  
        client_options: {  
        'site' => 'https://<{{projectName}} Systemadresse>/',  
        'authorize_url' => '/api/oidc/auth',  
        'user_info_url' => '/api/oidc/me',  
        'token_url' => '/api/oidc/token'  
        },  
        user_response_structure: {  
        root_path: [],  
        id_path: ['sub'],  
        attributes: { email:'email',  name:'nickname' },  
        },  
        scope: 'openid profile email',  
        'name' => '<{{projectName}}SystemName>’  
        }  
        }  
        ]  
    ```

    <img src="./images/integrations-gitlab-01.webp" alt="GitLab Konfigurationsdatei Setup" style="max-width:600px; width:100%">

3. Starten Sie den **GitLab**-Dienst neu, um die neuen Einstellungen zu übernehmen.
4. Melden Sie sich bei Bedarf als Administrator in der **GitLab**-Benutzeroberfläche an. Navigieren Sie zum Pfad **Admin (Admin Area) — Settings-General**.  

    Aktivieren Sie auf der sich öffnenden Seite im Block **Sign-in restrictions** das Kontrollkästchen neben <{{projectName}}SystemName> im Unterblock **Enabled OAuth authentication sources**.  

    <img src="./images/integrations-gitlab-02.webp" alt="GitLab Admin-Panel Setup" width="80%">

---

## Schritt 3. Integration überprüfen { #step-3-verify-integration }

1. Öffnen Sie die **GitLab**-Anmeldeseite.
2. Stellen Sie sicher, dass die Schaltfläche **Anmeldung über {{projectName}}** erschienen ist.
3. Klicken Sie auf die Schaltfläche und melden Sie sich mit Ihrem Unternehmenskonto an:

   * Das System leitet Sie zur **{{projectName}}**-Authentifizierungsseite weiter.
   * Geben Sie Ihre Unternehmens-Anmeldedaten ein.

    <img src="./images/integrations-gitlab-03.webp" alt="GitLab Login-Widget" style="max-width:600px; width:100%">

4. Nach erfolgreicher Authentifizierung sollten Sie zurück zu **GitLab** geleitet und automatisch in Ihr Konto eingeloggt werden.