---
title: "E-Mail-Login in Encvoy ID — E-Mail-Konfiguration"
description: "Erfahren Sie, wie Sie den E-Mail-Login in Encvoy ID aktivieren: Erstellen Sie eine Login-Methode und fügen Sie diese zum Autorisierungs-Widget hinzu. Verbindung in nur wenigen Schritten."
keywords:
  - E-Mail-Login in Encvoy ID
  - E-Mail-Konfiguration
  - E-Mail-Authentifizierung
  - E-Mail verbinden
  - E-Mail-Login Encvoy ID
  - E-Mail-OAuth Encvoy ID
author: Encvoy ID Team
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via E-Mail"
---

# So verbinden Sie den E-Mail-Login in Encvoy ID

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Login-Methoden. Weitere Details finden Sie im Leitfaden [Login-Methoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die E-Mail-Authentifizierung in Ihrer Organisation oder Anwendung aktivieren. Die E-Mail-Login-Methode wird zum Versenden von E-Mail-Benachrichtigungen verwendet, wie z. B. Registrierungs-E-Mails, Passwortwiederherstellung und andere Ereignisse.

Die Einrichtung des Logins via **E-Mail** besteht aus mehreren Schritten:

- [Schritt 1. Erstellen einer Login-Methode](#step-1-create-login-method)
- [Schritt 2. Hinzufügen zum Widget](#step-2-add-to-widget)

---

## Schritt 1. Erstellen einer Login-Methode { #step-1-create-login-method }

1. Gehen Sie zum Admin-Panel → Tab **Einstellungen**.

   > 💡 Um eine Login-Methode für eine Organisation zu erstellen, öffnen Sie das **Organisations-Dashboard**. Wenn die Login-Methode für eine bestimmte Anwendung benötigt wird, öffnen Sie **die Einstellungen dieser Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Create Button](./images/button-create.webp "Create Button").
4. Ein Fenster mit einer Liste von Vorlagen öffnet sich.
5. Wählen Sie die Vorlage **Email**.
6. Füllen Sie das Erstellungsformular aus:

   **Basisinformationen**
   - **Name** — Der Name, den die Benutzer sehen werden.
   - **Beschreibung** (optional) — Eine kurze Beschreibung.
   - **Logo** (optional) — Sie können Ihr eigenes Icon hochladen, andernfalls wird das Standard-Icon verwendet.

   **Parameter**
   - **Haupt-E-Mail-Adresse** — Die primäre E-Mail-Adresse, die zum Versenden von E-Mails verwendet wird.
   - **Postausgangsserver-Adresse** — Die Adresse des Postausgangsservers.
   - **Postausgangsserver-Port** — Der Port des Postausgangsservers.
   - **E-Mail-Passwort** — Ein reguläres Passwort oder ein App-Passwort, das in den Einstellungen des E-Mail-Dienstkontos erstellt wurde.
   - **Gültigkeitsdauer des Bestätigungscodes** — Die Lebensdauer des Bestätigungscodes für den E-Mail-Dienst in Sekunden.

   **Zusätzliche Einstellungen**
   - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, wenn diese Login-Methode zur Hinzufügung zu anderen System- (oder Organisations-) Anwendungen sowie zum Benutzerprofil als [externer Dienst-Identifikator](./docs-12-common-personal-profile.md#external-service-identifiers) verfügbar sein soll.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Login-Methode in der allgemeinen Liste der Anbieter.

---

## Schritt 2. Hinzufügen zum Widget { #step-2-add-to-widget }

Damit die Schaltfläche **Login via E-Mail** für Benutzer auf dem Autorisierungsformular sichtbar ist, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie die erstellte Login-Methode in der allgemeinen Liste der Anbieter.
2. Betätigen Sie den Schalter im Anbieter-Panel.

> **Überprüfung**: Öffnen Sie nach dem Speichern das Login-Formular in einer Testanwendung. Eine neue Schaltfläche mit dem **E-Mail**-Logo sollte auf dem Widget erscheinen.

---

## Siehe auch

- [Login-Methoden und Konfiguration des Login-Widgets](./docs-06-github-en-providers-settings.md) — ein Leitfaden zu Login-Methoden und zur Konfiguration des Login-Widgets.
- [Organisationsverwaltung](./docs-09-common-mini-widget-settings.md) — ein Leitfaden zur Arbeit mit Organisationen im **Encvoy ID**-System.
- [Persönliches Profil und Verwaltung von App-Berechtigungen](./docs-12-common-personal-profile.md) — ein Leitfaden zur Verwaltung des persönlichen Profils.
