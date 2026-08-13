---
title: "Umgebungsvariablen {{projectName}} — Administrator-Referenz"
description: "Erfahren Sie, wie Sie die {{projectName}} Umgebungsvariablen korrekt konfigurieren und einen sicheren Systembetrieb gewährleisten. Eine Schritt-für-Schritt-Anleitung für Administratoren."
keywords:
  - Umgebungsvariablen {{projectName}}
  - {{projectName}} env konfigurieren
  - OIDC env Variablen
  - OpenID Connect Umgebungsvariablen
  - OAuth 2.0 Umgebungskonfiguration
  - docker-compose env
  - PostgreSQL Konfiguration {{projectName}}
  - SMTP Konfiguration {{projectName}}
  - Schnittstellenanpassung {{projectName}}
  - CUSTOM_STYLES {{projectName}}
  - Sicherheit von Umgebungsvariablen
  - Administrator {{projectName}}
  - Serverkonfiguration {{projectName}}
  - Konfigurationsleitfaden {{projectName}}
  - Google Metriken {{projectName}}
author: "{{projectName}} Team"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Konfiguration der Umgebungsvariablen"
order: 3
---

# So konfigurieren Sie die {{projectName}} Umgebungsvariablen

In dieser Anleitung erfahren Sie, wie Sie die Umgebungsvariablen für **{{projectName}}** auf Ihrem Server konfigurieren. Wir werden alle Parameter im Detail aufschlüsseln — von der Datenbank und OIDC bis hin zu Cache, E-Mail und Schnittstelle —, um sicherzustellen, dass Ihr System vom ersten Start an korrekt funktioniert.

**Inhaltsverzeichnis:**

- [So konfigurieren Sie die {{projectName}} Umgebungsvariablen](#so-konfigurieren-sie-die-projectname-umgebungsvariablen)
  - [Allgemeine Umgebungsvariablen { #common-environment-variables }](#allgemeine-umgebungsvariablen--common-environment-variables-)
  - [Datenbank-Umgebungsvariablen (PostgreSQL) { #database-environment-variables }](#datenbank-umgebungsvariablen-postgresql--database-environment-variables-)
  - [Redis, Sitzungen und OIDC-Cookies { #redis-sessions-and-oidc-cookies }](#redis-sitzungen-und-oidc-cookies--redis-sessions-and-oidc-cookies-)
  - [Rate Limiting und Protokollierung { #rate-limiting-and-logging }](#rate-limiting-und-protokollierung--rate-limiting-and-logging-)
  - [E-Mail und Benachrichtigungen { #mail-and-notifications }](#e-mail-und-benachrichtigungen--mail-and-notifications-)
  - [Schnittstellenanpassung { #interface-customization }](#schnittstellenanpassung--interface-customization-)
  - [Urheberrecht { #copyright }](#urheberrecht--copyright-)
  - [Metriken { #metrics }](#metriken--metrics-)
  - [Siehe auch { #see-also }](#siehe-auch--see-also-)

> 💡 Um Umgebungsvariablen zu ändern, müssen Sie Anpassungen an der Datei **docker-compose.yml** vornehmen.

---

## Allgemeine Umgebungsvariablen { #common-environment-variables }

Diese Variablen definieren das grundlegende Verhalten und die Identifikation des Dienstes.

| Variable                    | Beschreibung                                                        | Standardwert                |
| --------------------------- | ------------------------------------------------------------------- | --------------------------- |
| `NODE_ENV`                  | Ausführungsumgebung der Anwendung (`development` oder `production`) | `production`                |
| `DOMAIN`                    | Domain des Dienstes                                                 | —                           |
| `ADMIN_LOGIN`               | Administrator-Login                                                 | `root`                      |
| `ADMIN_PASSWORD`            | Administrator-Passwort                                              | `changethis`                |
| `DELETE_PROFILE_AFTER_DAYS` | Anzahl der Tage, nach denen ein Benutzerprofil gelöscht wird        | `30`                        |
| `CLIENT_ID`                 | Eindeutige Anwendungs-ID (UUID empfohlen)                           | —                           |
| `CLIENT_SECRET`             | Eindeutiges Anwendungsgeheimnis (UUID empfohlen)                    | —                           |
| `MANUAL_URL`                | Link zur Dokumentation für Benutzer                                 | `https://your-domain/docs/` |

> ⚠️ Die Variablen `CLIENT_ID` und `CLIENT_SECRET` werden verwendet, um **{{projectName}}** als OAuth 2.0 / OpenID Connect Client zu identifizieren und müssen geheim gehalten werden.

---

## Datenbank-Umgebungsvariablen (PostgreSQL) { #database-environment-variables }

Parameter für die Verbindung zur PostgreSQL-Datenbank.

| Variable            | Beschreibung                                         | Standardwert |
| ------------------- | ---------------------------------------------------- | ------------ |
| `POSTGRES_USER`     | Benutzername für die PostgreSQL-Verbindung           | `user`       |
| `POSTGRES_PASSWORD` | Passwort des PostgreSQL-Benutzers                    | `password`   |
| `POSTGRES_DB`       | Datenbankname                                        | `mydb`       |
| `POSTGRES_HOST`     | Datenbank-Host                                       | `localhost`  |
| `POSTGRES_PORT`     | Port für die Datenbankverbindung                     | `5432`       |
| `DATABASE_URL`      | Vollständiger Connection-String im PostgreSQL-Format | —            |

---

## Redis, Sitzungen und OIDC-Cookies { #redis-sessions-and-oidc-cookies }

Einstellungen für die Sitzungsspeicherung, Daten-Caching und Authentifizierungssicherheit.

| Variable             | Beschreibung                                         | Standardwert         |
| -------------------- | ---------------------------------------------------- | -------------------- |
| `REDIS_HOST`         | Redis-Host                                           | `127.0.0.1`          |
| `REDIS_PORT`         | Redis-Port                                           | `6379`               |
| `OIDC_COOKIE_SECRET` | Geheimnis zum Signieren und Verifizieren von Cookies | —                    |
| `OIDC_SESSION_TTL`   | Sitzungslebensdauer in Sekunden                      | `86400` (24 Stunden) |

---

## Rate Limiting und Protokollierung { #rate-limiting-and-logging }

Einstellungen zum Schutz vor Missbrauch und zur Steuerung der Protokollierung.

| Variable             | Beschreibung                              | Standardwert     |
| -------------------- | ----------------------------------------- | ---------------- |
| `RATE_LIMIT`         | Anzahl der Anfragen für das Rate Limiting | `15`             |
| `RATE_LIMIT_TTL_SEC` | Zeitspanne in Sekunden für das Limit      | `900`            |
| `CONSOLE_LOG_LEVELS` | Protokollierungsebenen für die Konsole    | `log warn error` |

---

## E-Mail und Benachrichtigungen { #mail-and-notifications }

SMTP-Server-Einstellungen für den Versand von E-Mails (Registrierungsbestätigung, Passwort-Reset, etc.).

| Variable         | Beschreibung                                 | Standardwert | Beispiel                                                                                             |
| ---------------- | -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER` | E-Mail-Provider-Einstellungen im JSON-Format | —            | `{"hostname":"smtp.example.com","port":465,"root_mail":"admin@example.com","password":"SecretPass"}` |

---

## Schnittstellenanpassung { #interface-customization }

Das Erscheinungsbild von Schaltflächen, Links und Tabs wird über ein JSON-Objekt in der Variable `CUSTOM_STYLES` konfiguriert.

Die Variable `CUSTOM_STYLES` ermöglicht es Ihnen, die **{{projectName}}**-Schnittstelle anzupassen, ohne den Code zu ändern.

```env
# Zum Projektordner wechseln
cd /home/els/nodetrustedserverconfig

# Dienst vor Änderungen stoppen
docker compose stop

# .env-Datei bearbeiten
nano .env

# Beispiel für minimale Anpassung
CUSTOM_STYLES=`{"palette":{"white":{"accent":"#2c5aa0","accentHover":"#1e3a6f"}},"button":{"borderRadius":"8px"}}`

# Dienst wieder starten
docker compose up -d
```

Beschreibung der Variable `CUSTOM_STYLES`:

| Variable        | Beschreibung                                                                                                                                                        | Beispiel                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOM_STYLES` | Einstellungen für das Erscheinungsbild der Schnittstelle, einschließlich Farben, Schaltflächenstilen und Widgets. Der Wert muss zwingend ein einzeiliges JSON sein. | `CUSTOM_STYLES={"palette":{"white":{"accent":"#ff6f00","accentHover":"#f56b00","onAccentColor":"#fff"}},"button":{"borderRadius":"4px"},"widget":{"backgroundColor":"#ff6f00","color":"#fff","isHideText":false,"button":{"background":"#ffffff","hover":"#fadfcd","color":"#ff6f00"}},"isAccordionIconColored":true,"contentPosition":"center"}` |

| Parameter                | Beschreibung                                   | Beispiel                       |
| ------------------------ | ---------------------------------------------- | ------------------------------ |
| `accent`                 | Primärfarbe für Akzentelemente im HEX-Format   | `"#ff6f00"`                    |
| `accentHover`            | Farbe beim Hovern im HEX-Format                | `"#f56b00"`                    |
| `onAccentColor`          | Textfarbe auf Akzent-Hintergrund im HEX-Format | `"#fff"`                       |
| `secondaryAccent`        | Farbe für sekundäre Elemente im HEX-Format     | `"#fae9de"`                    |
| `borderColor`            | Rahmenfarbe für Elemente im HEX-Format         | `"#858BA0"`                    |
| `borderRadius`           | Eckenabrundung für Schaltflächen (`button`)    | `4px`, `8px`, etc.             |
| `isAccordionIconColored` | Akkordeon-Icons einfärben                      | `true`/`false`                 |
| `contentPosition`        | Inhaltsausrichtung                             | `"start"`, `"center"`, `"end"` |

---

## Urheberrecht { #copyright }

| Variable    | Beschreibung                           | Standardwert          | Beispiel                               |
| ----------- | -------------------------------------- | --------------------- | -------------------------------------- |
| `COPYRIGHT` | Copyright-Informationen im JSON-Format | `{"ru":" ","en":" "}` | `{"ru":"© Компания","en":"© Company"}` |

---

## Metriken { #metrics }

| Variable            | Beschreibung                        |
| ------------------- | ----------------------------------- |
| `GOOGLE_METRICA_ID` | ID für Google Analytics-Integration |

---

## Siehe auch { #see-also }

- [Systeminstallation {{projectName}}](./docs-02-box-system-install.md) — Anleitung zur Systeminstallation.
- [Systemkonfiguration](./docs-04-box-system-settings.md) — Anleitung zur Konfiguration der Schnittstelle und des Benutzerzugriffs auf das System.
