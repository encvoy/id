---
title: "Integrazione di GitLab con Encvoy ID — configurazione del single sign-on"
description: "Scopri come configurare il single sign-on per GitLab tramite Encvoy ID: configurazione semplice, protezione dei dati e accesso agevole per tutti i dipendenti dell'azienda."
keywords:
  - Integrazione GitLab con Encvoy ID
  - GitLab Encvoy ID
  - GitLab SSO
  - GitLab single sign-on
  - accesso SSO a GitLab
  - single sign-on in GitLab
  - autenticazione GitLab
  - autorizzazione GitLab
  - autenticazione OAuth GitLab
  - accesso a GitLab tramite Encvoy ID
  - configurazione di GitLab con Encvoy ID
  - connessione di GitLab a Encvoy ID
  - single sign-on in gitlab
author: "Il Team di Encvoy ID"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integrazione con GitLab"
---

# Come configurare l'integrazione di GitLab con Encvoy ID

In questa guida imparerai come configurare il single sign-on (SSO) in **GitLab** tramite il sistema **Encvoy ID**.

> 📌 [GitLab](https://about.gitlab.com/) è una piattaforma web per la gestione di progetti e repository di codice software, basata sul popolare sistema di controllo versione **Git**.

La configurazione dell'accesso tramite **Encvoy ID** consiste in diverse fasi chiave eseguite in due sistemi differenti.

- [Passaggio 1. Creazione dell'applicazione](#step-1-create-application)
- [Passaggio 2. Configurazione del sistema GitLab](#step-2-configure-gitlab)
- [Passaggio 3. Verifica dell'integrazione](#step-3-verify-integration)

---

## Passaggio 1. Creazione dell'applicazione { #step-1-create-application }

1. Accedi al sistema **Encvoy ID**.
2. Crea un'applicazione con le seguenti impostazioni:
   - **Indirizzo Applicazione** - l'indirizzo della tua installazione **GitLab**;
   - **URL di reindirizzamento \#1 (`Redirect_uri`)** - `<indirizzo installazione GitLab>/users/auth/oauth2_generic/callback`.

   > 🔍 Per maggiori dettagli sulla creazione di applicazioni, consulta le [istruzioni](./docs-10-common-app-settings.md#creating-application).

3. Apri le [impostazioni dell'applicazione](./docs-10-common-app-settings.md#editing-application) e copia i valori dei seguenti campi:
   - **Identificativo** (`Client_id`),
   - **Chiave segreta** (`client_secret`).

---

## Passaggio 2. Configurazione del sistema GitLab { #step-2-configure-gitlab }

La configurazione dell'autorizzazione utente per il servizio **GitLab** tramite **Encvoy ID** viene eseguita nel file di configurazione **gitlab.rb** di GitLab, situato nella cartella di configurazione del servizio (/config).

1. Apri il file di configurazione **gitlab.rb** in modalità modifica e vai al blocco **OmniAuth Settings**.
2. Imposta i seguenti valori per i parametri:

   ```bash
       gitlab_rails['omniauth_enabled'] = true
       gitlab_rails['omniauth_allow_single_sign_on'] = ['oauth2_generic', '<Encvoy IDSystemName>']
       gitlab_rails['omniauth_block_auto_created_users'] = false

       Il valore per gitlab_rails['omniauth_providers'] dovrebbe apparire come segue:

       gitlab_rails['omniauth_providers'] = [
       {
       'name' => 'oauth2_generic',
       'app_id' => '<Client_id dell'applicazione creata in Encvoy ID>',
       'app_secret' => '<Client_secret dell'applicazione creata in Encvoy ID>',
       'args' => {
       client_options: {
       'site' => 'https://<indirizzo sistema Encvoy ID>/',
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
       'name' => '<Encvoy IDSystemName>’
       }
       }
       ]
   ```

   <img src="./images/integrations-gitlab-01.webp" alt="Configurazione del file gitlab.rb" style="max-width:600px; width:100%">

3. Riavvia il servizio **GitLab** per applicare le nuove impostazioni.
4. Se necessario, accedi come amministratore all'interfaccia del servizio **GitLab**. Vai al percorso delle impostazioni **Admin (Admin Area) — Settings-General**.

   Nella pagina che si apre, nel blocco **Sign-in restrictions**, spunta la casella accanto a <Encvoy IDSystemName> nel sotto-blocco **Enabled OAuth authentication sources**.

   <img src="./images/integrations-gitlab-02.webp" alt="Configurazione pannello admin GitLab" width="80%">

---

## Passaggio 3. Verifica dell'integrazione { #step-3-verify-integration }

1. Apri la pagina di login di **GitLab**.
2. Assicurati che sia apparso il pulsante **Login via Encvoy ID**.
3. Clicca sul pulsante e accedi utilizzando il tuo account aziendale:
   - Il sistema ti reindirizzerà alla pagina di autenticazione di **Encvoy ID**.
   - Inserisci le tue credenziali aziendali.

    <img src="./images/integrations-gitlab-03.webp" alt="Widget di login GitLab" style="max-width:600px; width:100%">

4. Dopo l'autenticazione riuscita, dovresti essere reindirizzato a **GitLab** ed effettuare automaticamente l'accesso al tuo account.
