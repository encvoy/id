---
title: "Environment Variables Encvoy ID — Administrator Reference"
description: "Learn how to correctly configure Encvoy ID environment variables and ensure secure system operation. A step-by-step guide for administrators."
keywords:
  - environment variables Encvoy ID
  - configure Encvoy ID env
  - OIDC env variables
  - OpenID Connect environment variables
  - OAuth 2.0 environment configuration
  - docker-compose env
  - PostgreSQL configuration Encvoy ID
  - SMTP configuration Encvoy ID
  - interface customization Encvoy ID
  - CUSTOM_STYLES Encvoy ID
  - environment variable security
  - administrator Encvoy ID
  - server configuration Encvoy ID
  - configuration guide Encvoy ID
  - Google metrics Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Environment Variable Configuration"
order: 3
---

# How to Configure Encvoy ID Environment Variables

In this guide, you will learn how to configure the environment variables for **Encvoy ID** on your server. We will break down all parameters in detail — from the database and OIDC to cache, mail, and interface — to ensure your system works correctly from the first launch.

**Table of Contents:**

- [How to Configure Encvoy ID Environment Variables](#how-to-configure-encvoy-id-environment-variables)
  - [Common Environment Variables { #common-environment-variables }](#common-environment-variables--common-environment-variables-)
  - [Database Environment Variables (PostgreSQL) { #database-environment-variables }](#database-environment-variables-postgresql--database-environment-variables-)
  - [Redis, Sessions, and OIDC Cookies { #redis-sessions-and-oidc-cookies }](#redis-sessions-and-oidc-cookies--redis-sessions-and-oidc-cookies-)
  - [Rate Limiting and Logging { #rate-limiting-and-logging }](#rate-limiting-and-logging--rate-limiting-and-logging-)
  - [Mail and Notifications { #mail-and-notifications }](#mail-and-notifications--mail-and-notifications-)
  - [Interface Customization { #interface-customization }](#interface-customization--interface-customization-)
  - [Permissions and Licenses { #permissions-and-licenses }](#permissions-and-licenses--permissions-and-licenses-)
  - [Metrics { #metrics }](#metrics--metrics-)
  - [See Also { #see-also }](#see-also--see-also-)

> 💡 To change environment variables, you need to make changes to the **docker-compose.yml** file.

---

## Common Environment Variables { #common-environment-variables }

These variables define the basic behavior and identification of the service.

| Variable                    | Description                                                       | Default Value               |
| --------------------------- | ----------------------------------------------------------------- | --------------------------- |
| `NODE_ENV`                  | Application execution environment (`development` or `production`) | `production`                |
| `DOMAIN`                    | Service domain                                                    | —                           |
| `ADMIN_LOGIN`               | Administrator login                                               | `root`                      |
| `ADMIN_PASSWORD`            | Administrator password                                            | `changethis`                |
| `DELETE_PROFILE_AFTER_DAYS` | Number of days after which a user profile will be deleted         | `30`                        |
| `CLIENT_ID`                 | Unique application identifier (UUID recommended)                  | —                           |
| `CLIENT_SECRET`             | Unique application secret (UUID recommended)                      | —                           |
| `MANUAL_URL`                | Link to documentation for users                                   | `https://your-domain/docs/` |

> ⚠️ The `CLIENT_ID` and `CLIENT_SECRET` variables are used to identify **Encvoy ID** as an OAuth 2.0 / OpenID Connect client and must be kept secret.

---

## Database Environment Variables (PostgreSQL) { #database-environment-variables }

Parameters for connecting to the PostgreSQL database.

| Variable            | Description                                 | Default Value |
| ------------------- | ------------------------------------------- | ------------- |
| `POSTGRES_USER`     | Username for PostgreSQL connection          | `user`        |
| `POSTGRES_PASSWORD` | PostgreSQL user password                    | `password`    |
| `POSTGRES_DB`       | Database name                               | `mydb`        |
| `POSTGRES_HOST`     | Database host                               | `localhost`   |
| `POSTGRES_PORT`     | Database connection port                    | `5432`        |
| `DATABASE_URL`      | Full connection string in PostgreSQL format | —             |

---

## Redis, Sessions, and OIDC Cookies { #redis-sessions-and-oidc-cookies }

Settings for session storage, data caching, and authentication security.

| Variable             | Description                              | Default Value      |
| -------------------- | ---------------------------------------- | ------------------ |
| `REDIS_HOST`         | Redis host                               | `127.0.0.1`        |
| `REDIS_PORT`         | Redis port                               | `6379`             |
| `OIDC_COOKIE_SECRET` | Secret for signing and verifying cookies | —                  |
| `OIDC_SESSION_TTL`   | Session lifetime in seconds              | `86400` (24 hours) |

---

## Rate Limiting and Logging { #rate-limiting-and-logging }

Settings for protection against abuse and logging control.

| Variable             | Description                          | Default Value    |
| -------------------- | ------------------------------------ | ---------------- |
| `RATE_LIMIT`         | Number of requests for rate limiting | `15`             |
| `RATE_LIMIT_TTL_SEC` | Time period in seconds for the limit | `900`            |
| `CONSOLE_LOG_LEVELS` | Logging levels for the console       | `log warn error` |

---

## Mail and Notifications { #mail-and-notifications }

SMTP server settings for sending emails (registration confirmation, password reset, etc.).

| Variable         | Description                           | Default Value | Example                                                                                              |
| ---------------- | ------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER` | Mail provider settings in JSON format | —             | `{"hostname":"smtp.example.com","port":465,"root_mail":"admin@example.com","password":"SecretPass"}` |

---

## Interface Customization { #interface-customization }

The appearance of buttons, links, and tabs is configured via a JSON object in the `CUSTOM_STYLES` variable.

The `CUSTOM_STYLES` variable allows you to customize the **Encvoy ID** interface without changing the code.

```env
# Go to the project folder
cd /home/els/nodetrustedserverconfig

# Stop the service before making changes
docker compose stop

# Edit the .env file
nano .env

# Example of minimal customization
CUSTOM_STYLES=`{"palette":{"white":{"accent":"#2c5aa0","accentHover":"#1e3a6f"}},"button":{"borderRadius":"8px"}}`

# Start the service again
docker compose up -d
```

Description of the `CUSTOM_STYLES` variable:

| Variable        | Description                                                                                                                 | Example                                                                                                                                                                                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOM_STYLES` | Interface appearance settings, including colors, button styles, and widgets. The value must be strictly a single-line JSON. | `CUSTOM_STYLES={"palette":{"white":{"accent":"#ff6f00","accentHover":"#f56b00","onAccentColor":"#fff"}},"button":{"borderRadius":"4px"},"widget":{"backgroundColor":"#ff6f00","color":"#fff","isHideText":false,"button":{"background":"#ffffff","hover":"#fadfcd","color":"#ff6f00"}},"isAccordionIconColored":true,"contentPosition":"center"}` |

| Parameter                | Description                                     | Example                        |
| ------------------------ | ----------------------------------------------- | ------------------------------ |
| `accent`                 | Primary color for accent elements in HEX format | `"#ff6f00"`                    |
| `accentHover`            | Hover color in HEX format                       | `"#f56b00"`                    |
| `onAccentColor`          | Text color on accent background in HEX format   | `"#fff"`                       |
| `secondaryAccent`        | Color for secondary elements in HEX format      | `"#fae9de"`                    |
| `borderColor`            | Border color for elements in HEX format         | `"#858BA0"`                    |
| `borderRadius`           | Corner rounding for buttons (`button`)          | `4px`, `8px`, etc.             |
| `isAccordionIconColored` | Colorize accordion icons                        | `true`/`false`                 |
| `contentPosition`        | Content alignment                               | `"start"`, `"center"`, `"end"` |

---

## Permissions and Licenses { #permissions-and-licenses }

| Variable    | Description                          | Default Value         | Example                                |
| ----------- | ------------------------------------ | --------------------- | -------------------------------------- |
| `COPYRIGHT` | Copyright information in JSON format | `{"ru":" ","en":" "}` | `{"ru":"© Компания","en":"© Company"}` |

---

## Metrics { #metrics }

| Variable            | Description                         |
| ------------------- | ----------------------------------- |
| `GOOGLE_METRICA_ID` | ID for Google Analytics integration |

---

## See Also { #see-also }

- [System Installation Encvoy ID](./docs-02-box-system-install.md) — guide for system installation.
- [System Configuration](./docs-04-box-system-settings.md) — guide for configuring the interface and user access to the system.
