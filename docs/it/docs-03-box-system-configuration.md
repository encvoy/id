---
title: "Variabili d'ambiente Encvoy ID — Riferimento per l'amministratore"
description: "Scopri come configurare correttamente le variabili d'ambiente di Encvoy ID e garantire il funzionamento sicuro del sistema. Una guida passo-passo per gli amministratori."
keywords:
  - variabili d'ambiente Encvoy ID
  - configurare env Encvoy ID
  - variabili env OIDC
  - variabili d'ambiente OpenID Connect
  - configurazione ambiente OAuth 2.0
  - docker-compose env
  - configurazione PostgreSQL Encvoy ID
  - configurazione SMTP Encvoy ID
  - personalizzazione interfaccia Encvoy ID
  - CUSTOM_STYLES Encvoy ID
  - sicurezza variabili d'ambiente
  - amministratore Encvoy ID
  - configurazione server Encvoy ID
  - guida alla configurazione Encvoy ID
  - metriche Google Encvoy ID
author: "Team Encvoy ID"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Configurazione Variabili d'Ambiente"
order: 3
---

# Come configurare le variabili d'ambiente di Encvoy ID

In questa guida imparerai come configurare le variabili d'ambiente per **Encvoy ID** sul tuo server. Analizzeremo nel dettaglio tutti i parametri — dal database e OIDC alla cache, posta e interfaccia — per garantire che il sistema funzioni correttamente fin dal primo avvio.

**Sommario:**

- [Come configurare le variabili d'ambiente di Encvoy ID](#come-configurare-le-variabili-dambiente-di-encvoy-id)
  - [Variabili d'ambiente comuni { #common-environment-variables }](#variabili-dambiente-comuni--common-environment-variables-)
  - [Variabili d'ambiente del database (PostgreSQL) { #database-environment-variables }](#variabili-dambiente-del-database-postgresql--database-environment-variables-)
  - [Redis, Sessioni e Cookie OIDC { #redis-sessions-and-oidc-cookies }](#redis-sessioni-e-cookie-oidc--redis-sessions-and-oidc-cookies-)
  - [Rate Limiting e Logging { #rate-limiting-and-logging }](#rate-limiting-e-logging--rate-limiting-and-logging-)
  - [Posta e Notifiche { #mail-and-notifications }](#posta-e-notifiche--mail-and-notifications-)
  - [Personalizzazione dell'interfaccia { #interface-customization }](#personalizzazione-dellinterfaccia--interface-customization-)
  - [Permessi e Licenze { #permissions-and-licenses }](#permessi-e-licenze--permissions-and-licenses-)
  - [Metriche { #metrics }](#metriche--metrics-)
  - [Vedi anche { #see-also }](#vedi-anche--see-also-)

> 💡 Per modificare le variabili d'ambiente, è necessario apportare modifiche al file **docker-compose.yml**.

---

## Variabili d'ambiente comuni { #common-environment-variables }

Queste variabili definiscono il comportamento di base e l'identificazione del servizio.

| Variabile                   | Descrizione                                                             | Valore Predefinito          |
| --------------------------- | ----------------------------------------------------------------------- | --------------------------- |
| `NODE_ENV`                  | Ambiente di esecuzione dell'applicazione (`development` o `production`) | `production`                |
| `DOMAIN`                    | Dominio del servizio                                                    | —                           |
| `ADMIN_LOGIN`               | Login dell'amministratore                                               | `root`                      |
| `ADMIN_PASSWORD`            | Password dell'amministratore                                            | `changethis`                |
| `DELETE_PROFILE_AFTER_DAYS` | Numero di giorni dopo i quali un profilo utente verrà eliminato         | `30`                        |
| `CLIENT_ID`                 | Identificatore univoco dell'applicazione (consigliato UUID)             | —                           |
| `CLIENT_SECRET`             | Segreto univoco dell'applicazione (consigliato UUID)                    | —                           |
| `MANUAL_URL`                | Link alla documentazione per gli utenti                                 | `https://your-domain/docs/` |

> ⚠️ Le variabili `CLIENT_ID` e `CLIENT_SECRET` sono utilizzate per identificare **Encvoy ID** come client OAuth 2.0 / OpenID Connect e devono essere mantenute segrete.

---

## Variabili d'ambiente del database (PostgreSQL) { #database-environment-variables }

Parametri per la connessione al database PostgreSQL.

| Variabile           | Descrizione                                           | Valore Predefinito |
| ------------------- | ----------------------------------------------------- | ------------------ |
| `POSTGRES_USER`     | Nome utente per la connessione PostgreSQL             | `user`             |
| `POSTGRES_PASSWORD` | Password dell'utente PostgreSQL                       | `password`         |
| `POSTGRES_DB`       | Nome del database                                     | `mydb`             |
| `POSTGRES_HOST`     | Host del database                                     | `localhost`        |
| `POSTGRES_PORT`     | Porta di connessione al database                      | `5432`             |
| `DATABASE_URL`      | Stringa di connessione completa in formato PostgreSQL | —                  |

---

## Redis, Sessioni e Cookie OIDC { #redis-sessions-and-oidc-cookies }

Impostazioni per l'archiviazione delle sessioni, il caching dei dati e la sicurezza dell'autenticazione.

| Variabile            | Descrizione                                | Valore Predefinito |
| -------------------- | ------------------------------------------ | ------------------ |
| `REDIS_HOST`         | Host Redis                                 | `127.0.0.1`        |
| `REDIS_PORT`         | Porta Redis                                | `6379`             |
| `OIDC_COOKIE_SECRET` | Segreto per la firma e verifica dei cookie | —                  |
| `OIDC_SESSION_TTL`   | Durata della sessione in secondi           | `86400` (24 ore)   |

---

## Rate Limiting e Logging { #rate-limiting-and-logging }

Impostazioni per la protezione contro gli abusi e il controllo del logging.

| Variabile            | Descrizione                               | Valore Predefinito |
| -------------------- | ----------------------------------------- | ------------------ |
| `RATE_LIMIT`         | Numero di richieste per il rate limiting  | `15`               |
| `RATE_LIMIT_TTL_SEC` | Periodo di tempo in secondi per il limite | `900`              |
| `CONSOLE_LOG_LEVELS` | Livelli di logging per la console         | `log warn error`   |

---

## Posta e Notifiche { #mail-and-notifications }

Impostazioni del server SMTP per l'invio di email (conferma registrazione, reset password, ecc.).

| Variabile        | Descrizione                                     | Valore Predefinito | Esempio                                                                                              |
| ---------------- | ----------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER` | Impostazioni del provider email in formato JSON | —                  | `{"hostname":"smtp.example.com","port":465,"root_mail":"admin@example.com","password":"SecretPass"}` |

---

## Personalizzazione dell'interfaccia { #interface-customization }

L'aspetto di pulsanti, link e schede è configurato tramite un oggetto JSON nella variabile `CUSTOM_STYLES`.

La variabile `CUSTOM_STYLES` consente di personalizzare l'interfaccia di **Encvoy ID** senza modificare il codice.

```env
# Vai alla cartella del progetto
cd /home/els/nodetrustedserverconfig

# Ferma il servizio prima di apportare modifiche
docker compose stop

# Modifica il file .env
nano .env

# Esempio di personalizzazione minima
CUSTOM_STYLES=`{"palette":{"white":{"accent":"#2c5aa0","accentHover":"#1e3a6f"}},"button":{"borderRadius":"8px"}}`

# Avvia nuovamente il servizio
docker compose up -d
```

Descrizione della variabile `CUSTOM_STYLES`:

| Variabile       | Descrizione                                                                                                                                            | Esempio                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOM_STYLES` | Impostazioni dell'aspetto dell'interfaccia, inclusi colori, stili dei pulsanti e widget. Il valore deve essere rigorosamente un JSON su una sola riga. | `CUSTOM_STYLES={"palette":{"white":{"accent":"#ff6f00","accentHover":"#f56b00","onAccentColor":"#fff"}},"button":{"borderRadius":"4px"},"widget":{"backgroundColor":"#ff6f00","color":"#fff","isHideText":false,"button":{"background":"#ffffff","hover":"#fadfcd","color":"#ff6f00"}},"isAccordionIconColored":true,"contentPosition":"center"}` |

| Parametro                | Descrizione                                                | Esempio                        |
| ------------------------ | ---------------------------------------------------------- | ------------------------------ |
| `accent`                 | Colore primario per gli elementi di accento in formato HEX | `"#ff6f00"`                    |
| `accentHover`            | Colore al passaggio del mouse in formato HEX               | `"#f56b00"`                    |
| `onAccentColor`          | Colore del testo su sfondo accentato in formato HEX        | `"#fff"`                       |
| `secondaryAccent`        | Colore per gli elementi secondari in formato HEX           | `"#fae9de"`                    |
| `borderColor`            | Colore del bordo per gli elementi in formato HEX           | `"#858BA0"`                    |
| `borderRadius`           | Arrotondamento degli angoli per i pulsanti (`button`)      | `4px`, `8px`, ecc.             |
| `isAccordionIconColored` | Colora le icone della fisarmonica (accordion)              | `true`/`false`                 |
| `contentPosition`        | Allineamento del contenuto                                 | `"start"`, `"center"`, `"end"` |

---

## Permessi e Licenze { #permissions-and-licenses }

| Variabile   | Descrizione                                | Valore Predefinito    | Esempio                                |
| ----------- | ------------------------------------------ | --------------------- | -------------------------------------- |
| `COPYRIGHT` | Informazioni sul copyright in formato JSON | `{"ru":" ","en":" "}` | `{"ru":"© Компания","en":"© Company"}` |

---

## Metriche { #metrics }

| Variabile           | Descrizione                            |
| ------------------- | -------------------------------------- |
| `GOOGLE_METRICA_ID` | ID per l'integrazione Google Analytics |

---

## Vedi anche { #see-also }

- [Installazione del sistema Encvoy ID](./docs-02-box-system-install.md) — guida per l'installazione del sistema.
- [Configurazione del sistema](./docs-04-box-system-settings.md) — guida per la configurazione dell'interfaccia e dell'accesso utente al sistema.
