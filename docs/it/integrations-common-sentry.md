---
title: "Integrazione di Sentry con Encvoy ID — Configurazione SSO"
description: "Scopri come configurare il single sign-on per Sentry tramite Encvoy ID: configurazione semplice, protezione dei dati e accesso fluido per tutti i dipendenti dell'azienda."
keywords: 
keywords:
  - integrazione Sentry con Encvoy ID
  - Sentry Encvoy ID
  - Sentry SSO
  - Sentry single sign-on
  - accesso SSO a Sentry
  - single sign-on in Sentry
  - autenticazione Sentry
  - autorizzazione Sentry
  - autenticazione OAuth Sentry
  - OAuth Sentry
  - accesso a Sentry tramite Encvoy ID
  - configurazione Sentry con Encvoy ID
  - collegare Sentry a Encvoy ID
  - configurazione sentry sso
  - single sign-on in sentry
author: "Il Team di Encvoy ID"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integrazione con Sentry"
---

# Come Configurare l'Integrazione di Sentry con Encvoy ID

In questa guida imparerai come configurare il Single Sign-On (SSO) per **Sentry** utilizzando il sistema **Encvoy ID**.

**Sentry** è una piattaforma per il monitoraggio e il tracciamento degli errori delle applicazioni. Aiuta gli sviluppatori a identificare, analizzare e correggere i bug in tempo reale, migliorando la qualità del software.

La versione base del prodotto non supporta l'autenticazione **OpenID Connect**. Per implementare questa funzionalità, è possibile utilizzare una soluzione aggiuntiva — [sentry-auth-oidc](https://github.com/siemens/sentry-auth-oidc). Si tratta di un provider specializzato che abilita l'integrazione **OpenID Connect** con **Sentry** e consente di configurare il Single Sign-On (SSO) nel sistema.

La configurazione dell'accesso tramite **Encvoy ID** consiste in diversi passaggi chiave eseguiti in due sistemi differenti:

- [Passaggio 1. Creare un'Applicazione](#step-1-create-application)
- [Passaggio 2. Installare sentry-auth-oidc](#step-2-install-sentry-auth-oidc)
- [Passaggio 3. Verificare la Connessione](#step-3-verify-connection)

---

## Passaggio 1. Creare un'Applicazione { #step-1-create-application }

1. Accedi o registrati su **Encvoy ID**.
2. Crea un'applicazione con le seguenti impostazioni:

   | Campo                                      | Valore                                       |
   | ------------------------------------------ | -------------------------------------------- |
   | URL Applicazione                           | Indirizzo della tua installazione **Sentry** |
   | URL di Reindirizzamento \#1 (Redirect_uri) | `<indirizzo installazione>/auth/sso`         |

   > 🔍 Per maggiori dettagli sulla creazione di applicazioni, leggi le [istruzioni](./docs-10-common-app-settings.md#creating-application).

3. Apri le [impostazioni dell'applicazione](./docs-10-common-app-settings.md#editing-application) e copia i valori dei seguenti campi:
   - **Client ID** (`Client_id`),
   - **Client Secret** (`client_secret`).

---

## Passaggio 2. Installare sentry-auth-oidc { #step-2-install-sentry-auth-oidc }

1. Per installare il provider, esegui il comando da console:

   ```python
   $ pip install sentry-auth-oidc
   ```

   oppure crea uno script Shell con il seguente contenuto:

   ```sh
   #!/bin/bash
   set -euo pipefail
   apt-get update
   pip install sentry-auth-oidc
   ```

   ed eseguilo dalla directory `<percorso di Sentry>/sentry/`.

2. Dopo aver installato il provider, modifica il file di configurazione di **Sentry** `sentry.conf.py`. Nel file di configurazione, aggiungi un blocco di variabili con i parametri **OIDC_CLIENT_ID** e **OIDC_CLIENT_SECRET** copiati dall'applicazione **Encvoy ID**.

   ```sh
   #################
   # OIDC #
   #################

   #SENTRY_MANAGED_USER_FIELDS = ('email', 'first_name', 'last_name', 'password', )

   OIDC_CLIENT_ID = "client id dall'applicazione Encvoy ID"
   OIDC_CLIENT_SECRET = "client secret dall'applicazione Encvoy ID"
   OIDC_SCOPE = "openid email profile"
   OIDC_DOMAIN = "https://<indirizzo Encvoy ID>/api/oidc"
   OIDC_ISSUER = "nome modulo per il rilascio dei permessi"
   ```

   Successivamente, esegui lo script `install.sh` situato nella root del progetto **Sentry**, attendi il completamento dello script e avvia il progetto.

3. Vai al pannello di amministrazione di **Sentry** all'indirizzo `https://<percorso di Sentry>/settings/sentry/` e seleziona la sezione **Auth**. Quindi seleziona l'applicazione **Encvoy ID**.

<img src="./images/integrations-sentry-03.webp" alt="Pannello Admin Sentry" style="max-width:700px; width:100%">

Configura tutte le impostazioni necessarie e salva le modifiche. Dopo questo passaggio, l'autorizzazione tramite **Encvoy ID** sarà abilitata e l'accesso tramite nome utente/password sarà disabilitato.

---

## Passaggio 3. Verificare la Connessione { #step-3-verify-connection }

1. Apri la pagina di login di **Sentry**.
2. Assicurati che sia apparso il pulsante **Login via Encvoy ID**.
3. Clicca sul pulsante e accedi utilizzando le tue credenziali aziendali:
   - Verrai reindirizzato alla pagina di autenticazione di **Encvoy ID**;
   - Dopo un accesso riuscito, verrai reindirizzato nuovamente a **Sentry** come utente autorizzato.

<img src="./images/integrations-sentry-01.webp" alt="Widget Login Sentry" style="max-width:500px; width:100%">
