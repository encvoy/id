---
title: "Integrazione di Grafana con {{projectName}} — Configurazione del Single Sign-On"
description: "Scopri come configurare il Single Sign-On in Grafana tramite {{projectName}}: configurazione semplice, protezione dei dati e accesso conveniente per tutti i dipendenti dell'azienda."
keywords:
  # Основные термины и варианты
  - Grafana integration with {{projectName}}
  - Grafana {{projectName}}
  - Grafana SSO
  - Grafana single sign-on
  - SSO login to Grafana
  - single sign-on in Grafana
  - Grafana authentication
  - Grafana authorization
  - Grafana OAuth authentication
  - login to Grafana via {{projectName}}
  - configuring Grafana with {{projectName}}
  - connecting Grafana to {{projectName}}
  - Grafana OAuth provider
  - grafana sso configuration
  - single sign-on in grafana
author: "Il Team di {{projectName}}"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integrazione con Grafana"
---

# Come configurare l'integrazione di Grafana con {{projectName}}

In questa guida imparerai come configurare il Single Sign-On (SSO) in **Grafana** utilizzando il sistema **{{projectName}}**.

> 📌 [Grafana](https://www.grafana.com/) è un sistema di visualizzazione dati open-source focalizzato sui dati dei sistemi di monitoraggio IT.

La configurazione dell'accesso tramite **{{projectName}}** consiste in diversi passaggi chiave eseguiti in due sistemi differenti.

- [Passaggio 1. Creazione dell'applicazione](#step-1-create-application)
- [Passaggio 2. Configurazione del sistema Grafana](#step-2-configure-grafana)
- [Passaggio 3. Verifica della connessione](#step-3-verify-connection)

---

## Passaggio 1. Creazione dell'applicazione { #step-1-create-application }

1. Accedi al sistema **{{projectName}}**.  
2. Crea un'applicazione con le seguenti impostazioni:  

   - **Indirizzo dell'applicazione** - l'indirizzo della tua installazione di **Grafana**;  
   - **URL di reindirizzamento \#1 (Redirect_uri)** - `<indirizzo installazione Grafana>/login/generic_oauth`.  

    > 🔍 Per maggiori dettagli sulla creazione delle applicazioni, consulta le [istruzioni](./docs-10-common-app-settings.md#creating-application).

3. Apri le [impostazioni dell'applicazione](./docs-10-common-app-settings.md#editing-application) e copia i valori dei seguenti campi:

    - **Identificativo** (`Client_id`),
    - **Chiave Segreta** (`client_secret`).  

---

## Passaggio 2. Configurazione del sistema Grafana { #step-2-configure-grafana }

La configurazione dell'autorizzazione tramite **{{projectName}}** viene eseguita nel file di configurazione **grafana.ini**, che su Linux si trova solitamente in: `/etc/grafana/grafana.ini`.  

1. Apri il file **grafana.ini** in modalità modifica.
2. Trova o aggiungi il blocco `[auth.generic_oauth]` e imposta i seguenti parametri:  

    ```ini
       [auth.generic_oauth]  
       enabled = true  
       name = <{{projectName}}SystemName>  
       allow_sign_up = true  
       client_id = <Client_id dell'applicazione creata in {{projectName}}>  
       client_secret = <Client_secret dell'applicazione creata in {{projectName}}>  
       scopes = openid profile email  
       empty_scopes = false  
       email_attribute_name = email:email  
       email_attribute_path = data.email  
       login_attribute_path = data.login  
       name_attribute_path = data.givenName  
       auth_url = https://<indirizzo sistema {{projectName}}>/api/oidc/auth  
       token_url = https://<indirizzo sistema {{projectName}}>/api/oidc/token
       api_url = https://<indirizzo sistema {{projectName}}>/api/oidc/me  
    ```

    <img src="./images/integrations-grafana-01.webp" alt="Grafana configuration file setup" style="max-width:600px; width:100%">

3. Riavvia il servizio **Grafana** per applicare le nuove impostazioni.  

    ```bash
    sudo systemctl restart grafana-server
    ```

---

## Passaggio 3. Verifica della connessione { #step-3-verify-connection }

1. Apri la pagina di login di **Grafana**.
2. Assicurati che sia apparso il pulsante **Sign in with {{projectName}}**.
3. Clicca sul pulsante e accedi utilizzando le tue credenziali aziendali:

    - Verrai reindirizzato alla pagina di autenticazione di **{{projectName}}**;
    - Dopo un login riuscito, verrai riportato su **Grafana** come utente autorizzato.

    <img src="./images/integrations-grafana-02.webp" alt="Grafana login widget" style="max-width:600px; width:100%">