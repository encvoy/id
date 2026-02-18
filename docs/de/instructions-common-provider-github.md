---
title: "GitHub Login — Verbindung und Konfiguration in Encvoy ID"
description: "Erfahren Sie, wie Sie den GitHub-Login in Encvoy ID aktivieren: Erstellen Sie eine Login-Methode und fügen Sie diese zum Autorisierungs-Widget hinzu. Verbindung in nur wenigen Schritten."
keywords:
  - GitHub login
  - GitHub setup in Encvoy ID
  - GitHub authentication
  - GitHub connection
  - GitHub login Encvoy ID
  - GitHub OAuth Encvoy ID
  - GitHub sign in
  - GitHub authorization
  - GitHub Encvoy ID
  - login via GitHub Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [en]
menu_title: "GitHub Login"
---

# So verbinden Sie den GitHub-Login in Encvoy ID

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Login-Methoden. Weitere Details finden Sie im Leitfaden [Login-Methoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die Authentifizierung über ein **GitHub**-Konto mit dem **Encvoy ID**-System verbinden. Diese Login-Methode ermöglicht es Benutzern, sich mit ihrem **GitHub**-Dienstkonto bei Anwendungen anzumelden.

Die Einrichtung des **GitHub**-Logins besteht aus drei wesentlichen Schritten, die in zwei verschiedenen Systemen durchgeführt werden.

- [Schritt 1. GitHub App konfigurieren](#step-1-configure-github-app)
- [Schritt 2. Login-Methode erstellen](#step-2-create-login-method)
- [Schritt 3. Zum Widget hinzufügen](#step-3-add-to-widget)

---

## Schritt 1. GitHub App konfigurieren { #step-1-configure-github-app }

Bevor Sie die Login-Methode in **Encvoy ID** konfigurieren, müssen Sie Ihre Anwendung in der **GitHub**-Entwicklerkonsole registrieren und Zugriffsschlüssel erhalten:

1. Rufen Sie die **GitHub**-Einstellungen über den folgenden Link auf:
   [https://github.com/settings/developers](https://github.com/settings/developers)

2. Klicken Sie im Bereich **OAuth Apps** auf **New OAuth App**.
3. Füllen Sie die erforderlichen Anwendungseinstellungen aus:
   - **Application name** - der Name der Anwendung,
   - **Homepage URL** - die Adresse der Service-Installation,
   - **Authorization callback URL** - die Adresse im Format `https://<installations_adresse>/api/interaction/code`.

   <img src="./images/instructions-provider-github-01.webp" alt="Erstellen einer GitHub OAuth Login-Methode in der Service-Entwicklerkonsole" style="max-width:400px; width:100%">

4. Klicken Sie auf **Register application**.
5. Öffnen Sie nach dem Erstellen der Anwendung deren Einstellungen und kopieren Sie:
   - **Client ID**
   - **Client Secret** (erstellt über die Schaltfläche **Generate a new client secret**)

   <img src="./images/instructions-provider-github-02.webp" alt="Erstellen einer GitHub OAuth Login-Methode in der Service-Entwicklerkonsole" style="max-width:700px; width:100%">

Diese Werte werden im nächsten Schritt benötigt.

---

## Schritt 2. Login-Methode erstellen { #step-2-create-login-method }

1. Gehen Sie zur Admin-Konsole → Registerkarte **Einstellungen**.

   > 💡 Um eine Login-Methode für eine Organisation zu erstellen, öffnen Sie die **Organisationskonsole**. Wenn die Login-Methode für eine bestimmte Anwendung benötigt wird, öffnen Sie die **Einstellungen dieser Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Create Button](./images/button-create.webp "Create Button").
4. Ein Fenster mit einer Liste von Vorlagen wird geöffnet.
5. Wählen Sie die **GitHub**-Vorlage aus.
6. Füllen Sie das Erstellungsformular aus:

   **Basisinformationen**
   - **Name** — Der Name, den die Benutzer sehen werden.
   - **Beschreibung** (optional) — Eine kurze Beschreibung.
   - **Logo** (optional) — Sie können ein eigenes Symbol hochladen, andernfalls wird das Standardsymbol verwendet.

   **Authentifizierungsparameter**
   - **Client-ID (client_id)** — Fügen Sie die kopierte **Client ID** ein.
   - **Client-Geheimnis (client_secret)** — Fügen Sie das kopierte **Client Secret** ein.
   - **Rücksprung-URL (Redirect URI)** — Dieses Feld wird automatisch basierend auf Ihrer Domain ausgefüllt.

   **Zusätzliche Einstellungen**
   - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, wenn diese Login-Methode für andere Anwendungen im System (oder der Organisation) sowie für das Benutzerprofil als [externer Dienst-Identifikator](./docs-12-common-personal-profile.md#external-service-identifiers) verfügbar sein soll.
   - **Öffentlichkeit** — Konfigurieren Sie die Standard-Sichtbarkeitsstufe für den externen Dienst-Identifikator im Benutzerprofil.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Login-Methode in der allgemeinen Liste der Anbieter.

---

## Schritt 3. Zum Widget hinzufügen { #step-3-add-to-widget }

Damit die Schaltfläche **Mit GitHub anmelden** auf dem Autorisierungsformular sichtbar ist, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie in der allgemeinen Liste der Anbieter die erstellte Login-Methode.
2. Aktivieren Sie den Kippschalter im Anbieter-Panel.

> **Überprüfung**: Öffnen Sie nach dem Speichern das Login-Formular in einer Testanwendung. Eine neue Schaltfläche mit dem **GitHub**-Logo sollte im Widget erscheinen.

---

## Parameterbeschreibungen

### Basisinformationen

| Name             | Beschreibung                                                                            | Typ                     | Einschränkungen  |
| ---------------- | --------------------------------------------------------------------------------------- | ----------------------- | ---------------- |
| **Name**         | Der Name, der in der **Encvoy ID**-Serviceoberfläche angezeigt wird                     | Text                    | Max. 50 Zeichen  |
| **Beschreibung** | Eine kurze Beschreibung, die in der **Encvoy ID**-Serviceoberfläche angezeigt wird      | Text                    | Max. 255 Zeichen |
| **Logo**         | Das Bild, das in der **Encvoy ID**-Serviceoberfläche und im Login-Widget angezeigt wird | JPG, GIF, PNG oder WEBP | Max. Größe: 1 MB |

### Authentifizierungsparameter

| Name                                                 | Parameter       | Beschreibung                                                                                                            |
| ---------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Client-ID (client_id)**                            | `Client_id`     | Die ID der in **GitHub** erstellten Anwendung                                                                           |
| **Client-Geheimnis (client_secret)**                 | `Client_secret` | Der Dienst-Zugriffsschlüssel der in **GitHub** erstellten Anwendung                                                     |
| **Rücksprung-URL (Redirect URI)** (nicht editierbar) | `Redirect URI`  | Die **Encvoy ID**-Adresse, zu der der Benutzer nach der Authentifizierung beim Drittanbieter-Dienst weitergeleitet wird |

### Zusätzliche Einstellungen

| Name                           | Beschreibung                                                                                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Öffentliche Anmeldemethode** | Wenn aktiviert: <br> - Die Login-Methode wird für andere Service-Anwendungen verfügbar. <br> - Die Login-Methode wird als [externer Dienst-Identifikator](./docs-12-common-personal-profile.md#external-service-identifiers) im Benutzerprofil verfügbar. |
| **Öffentlichkeit**             | Legt die Standard-Sichtbarkeitsstufe für den externen Dienst-Identifikator im Benutzerprofil fest                                                                                                                                                         |

---

## Siehe auch

- [Login-Methoden und Konfiguration des Login-Widgets](./docs-06-github-en-providers-settings.md) — ein Leitfaden zu Login-Methoden und zur Konfiguration des Login-Widgets.
- [Organisationsverwaltung](./docs-09-common-mini-widget-settings.md) — ein Leitfaden zur Arbeit mit Organisationen im **Encvoy ID**-System.
- [Persönliches Profil und Verwaltung von Anwendungsberechtigungen](./docs-12-common-personal-profile.md) — ein Leitfaden zur Verwaltung des persönlichen Profils.
