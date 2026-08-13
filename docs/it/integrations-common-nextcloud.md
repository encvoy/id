---
title: "Integrazione di Nextcloud con {{projectName}} — Configurazione del Single Sign-On"
description: "Scopri come configurare il Single Sign-On in Nextcloud tramite {{projectName}}: configurazione semplice, protezione dei dati e accesso agevole per tutti i dipendenti dell'azienda."
keywords:
  - Integrazione Nextcloud con {{projectName}}
  - Nextcloud {{projectName}}
  - Nextcloud SSO
  - Nextcloud single sign-on
  - Accesso SSO a Nextcloud
  - single sign-on in Nextcloud
  - Autenticazione Nextcloud
  - Autorizzazione Nextcloud
  - Autenticazione OAuth Nextcloud
  - OAuth Nextcloud
  - OpenID Connect Nextcloud
  - OIDC Nextcloud
  - accesso a Nextcloud tramite {{projectName}}
  - configurazione di Nextcloud con {{projectName}}
  - connessione di Nextcloud a {{projectName}}
  - Nextcloud Social Login
  - plugin Social Login
  - configurazione sso nextcloud
  - single sign-on in nextcloud
author: "Team {{projectName}}"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integrazione con Nextcloud"
---

# Come configurare l'integrazione di Nextcloud con {{projectName}}

In questa guida imparerai come configurare il Single Sign-On (SSO) in **Nextcloud** utilizzando il sistema **{{projectName}}**.

> 📌 [Nextcloud](https://nextcloud.com/) è un ecosistema di servizi per la comunicazione aziendale e la collaborazione, che combina chiamate, videoconferenze, chat e gestione delle attività.

La configurazione dell'accesso con **{{projectName}}** si compone di due fasi chiave eseguite in due sistemi diversi.

- [Passaggio 1. Creazione dell'applicazione](#step-1-create-application)
- [Passaggio 2. Configurazione di Nextcloud](#step-2-configure-nextcloud)
- [Passaggio 3. Verifica della connessione](#step-3-verify-connection)

---

## Passaggio 1. Creazione dell'applicazione { #step-1-create-application }

1. Accedi a **{{projectName}}**.  
2. Crea una nuova applicazione e specifica:

    - **Indirizzo dell'applicazione** - l'indirizzo della tua installazione **Nextcloud**. Ad esempio: `https://<indirizzo-installazione-nextcloud>`.  
    - **URL di reindirizzamento \#1** (`Redirect_uri`) - l'indirizzo nel formato `https://<indirizzo-installazione-nextcloud>/api/oauth/return`.  

      > 🔍 Per maggiori dettagli sulla creazione di applicazioni, consulta le [istruzioni](./docs-10-common-app-settings.md#creating-application).

3. Apri le [impostazioni dell'applicazione](./docs-10-common-app-settings.md#editing-application) e copia i valori dei seguenti campi:

    - **Identificatore** (`Client_id`),
    - **Chiave segreta** (`client_secret`).  

---

## Passaggio 2. Configurazione di Nextcloud { #step-2-configure-nextcloud }

1. Accedi a **Nextcloud** con privilegi di amministratore.
2. Installa l'applicazione **Social Login**. Questa app consente agli utenti di accedere al sistema **Nextcloud** utilizzando account di servizi di terze parti. Maggiori informazioni sull'app sono disponibili su [apps.nextcloud.com](https://apps.nextcloud.com/apps/sociallogin).

    - Vai alla sezione **App** → **Social & communication**.

      <img src="./images/integrations-nextcloud-02.webp" alt="Navigazione verso la sezione App" style="max-width:300px; width:100%">

    - Clicca su **Scarica e abilita** per l'app **Social Login**.

      <img src="./images/integrations-nextcloud-03.webp" alt="Abilitazione di Social Login" style="max-width:300px; width:100%">

      Dopo l'installazione dell'app, apparirà una sottosezione **Social login** nella sezione **Impostazioni di amministrazione**.

3. Vai in **Impostazioni di amministrazione** → sottosezione **Social login**.
4. Clicca sul pulsante ![Pulsante Aggiungi connessione](./images/integrations-nextcloud-04.webp "Pulsante Aggiungi connessione") accanto al campo **Custom OpenID Connect**.
5. Compila i parametri di connessione:

    - **Internal name** - specifica il nome interno del servizio di autenticazione come apparirà nelle impostazioni di **Nextcloud**.
    - **Title** - specifica un nome intuitivo per il servizio di autenticazione. Questo nome verrà visualizzato sul pulsante della pagina di login e nelle impostazioni di **Nextcloud**.
    - **Authorize url** - specifica l'URL di autorizzazione. Ad esempio, `https://<indirizzo-installazione-{{projectName}}>/api/oidc/auth`.
    - **URL token** - specifica l'URL per ottenere il token di accesso. Ad esempio, `https://<indirizzo-installazione-{{projectName}}>/api/oidc/token`.
    - **Client id** - specifica il valore creato al **Passaggio 1**.
    - **Client Secret** - specifica il valore creato al **Passaggio 1**.
    - **Scope** - specifica i permessi richiesti per il recupero dei dati. Lo scope obbligatorio è `openid` e lo scope standard è `profile`. Quando specifichi più permessi, separali con uno spazio. Ad esempio: `profile email openid`.

    <img src="./images/integrations-nextcloud-05.webp" alt="Parametri di connessione" style="max-width:600px; width:100%">

6. Se necessario, configura le impostazioni aggiuntive:

    <img src="./images/integrations-nextcloud-06.webp" alt="Impostazioni di connessione aggiuntive" style="max-width:600px; width:100%">

Al termine di tutti i passaggi, il pulsante di accesso per **{{projectName}}** verrà visualizzato nel widget di autorizzazione di **Nextcloud**.

---

## Passaggio 3. Verifica della connessione { #step-3-verify-connection }

1. Apri la pagina di login di **Nextcloud**.
2. Assicurati che sia apparso il pulsante **Accedi con {{projectName}}**.
3. Clicca sul pulsante e accedi utilizzando le tue credenziali aziendali:

    - Verrai reindirizzato alla pagina di autenticazione di **{{projectName}}**;
    - Dopo un accesso riuscito, verrai riportato su **Nextcloud** come utente autorizzato.

    <img src="./images/integrations-nextcloud-07.webp" alt="Widget di login Nextcloud" style="max-width:300px; width:100%">