---
title: "Login via HOTP — Verbindung und Konfiguration in Encvoy ID"
description: "Erfahren Sie, wie Sie den HOTP-Login in Encvoy ID aktivieren: Erstellen Sie eine Login-Methode, fügen Sie diese zum Autorisierungs-Widget hinzu und gewährleisten Sie einen sicheren Zugriff für Benutzer."
keywords:
  - Login via HOTP
  - HOTP Authentifizierung
  - HOTP Konfiguration
  - HOTP Verbindung
  - HOTP Login
  - HOTP Zwei-Faktor-Authentifizierung
  - HOTP Encvoy ID
  - Login via HOTP Encvoy ID
  - HOTP Einrichtung in Encvoy ID
  - HOTP
  - HMAC-basierte Einmalpasswörter
  - Einmalpasswort
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via HOTP"
---

# So verbinden Sie den Login via HOTP in Encvoy ID

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Login-Methoden. Weitere Details finden Sie im Leitfaden [Login-Methoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die **HOTP**-Einmalpasswort-Authentifizierung mit dem **Encvoy ID**-System verbinden.

Für wen diese Anleitung gedacht ist:

- Administratoren — zur Konfiguration der Login-Methode im System.
- Benutzer — zur Verknüpfung von **HOTP** mit ihrem Profil.

Die Einrichtung des Logins via **HOTP** besteht aus mehreren wichtigen Phasen:

- [Authentifizierungs-Setup für Administratoren](#admin-authentication-setup)
- [HOTP-Bindung für Benutzer](#hotp-user-binding)

---

## Allgemeine Informationen

**HOTP** (HMAC-based One-Time Password) ist ein Algorithmus zur Generierung von Einmalpasswörtern basierend auf einem geheimen Schlüssel und einem Zähler, der sich mit jeder erfolgreichen Code-Nutzung erhöht. Er wird häufig für die Zwei-Faktor-Authentifizierung verwendet und fügt eine Sicherheitsebene über dem Standard-Benutzernamen und -Passwort hinzu.

Der Hauptunterschied zwischen **HOTP** und **TOTP** besteht darin, dass die Codes nicht zeitabhängig sind. Jede Verwendung eines Codes erhöht den Zähler, und der Server verifiziert den eingegebenen Code gegen den aktuellen Zählerwert.

> 💡 Um eine Login-Methode basierend auf **TOTP** zu erstellen, nutzen Sie die Anleitung [So verbinden Sie den Login via TOTP](./instructions-common-provider-totp.md).

**Hauptkomponenten:**

- **Authentifizierungsserver** — der Server, der den geheimen Schlüssel generiert und die eingegebenen Codes unter Berücksichtigung des Zählers verifiziert.
- **Authenticator** — eine Anwendung, die den geheimen Schlüssel und den aktuellen Zähler speichert und Einmalpasswörter generiert.
- **Geheimer Schlüssel** — eine gemeinsame Basis zwischen dem Server und der Anwendung, die zur Generierung von Codes verwendet wird.

### Wie HOTP funktioniert

1. **Vorläufige Einrichtung**
   - Der Administrator erstellt eine **HOTP**-Login-Methode und aktiviert diese für die Widgets der erforderlichen Anwendungen.
   - Der Benutzer fügt eine neue **HOTP**-Kennung in seinem Profil hinzu, indem er einen QR-Code mit dem geheimen Schlüssel über eine Authenticator-App scannt.

2. **Code-Generierung und Verifizierung**
   - Die Authenticator-App berechnet ein Einmalpasswort basierend auf dem geheimen Schlüssel und dem aktuellen Zählerwert unter Verwendung des `SHA1`-, `SHA256`- oder `SHA512`-Algorithmus.
   - Wenn der Benutzer den Code im Login-Formular eingibt, berechnet der Server den erwarteten Code mit demselben Geheimnis und dem aktuellen Zähler.
   - Wenn der Code übereinstimmt, erhöht der Server den Zähler und gewährt dem Benutzer Zugriff.

> 🚨 **Wichtig**: **HOTP** ist nicht zeitabhängig, daher ist keine Zeitsynchronisation erforderlich.

---

## Authentifizierungs-Setup für Administratoren { #admin-authentication-setup }

### Schritt 1. Erstellen einer Login-Methode

1. Gehen Sie zum Admin-Panel → Tab **Einstellungen**.

   > 💡 Um eine Login-Methode für eine Organisation zu erstellen, öffnen Sie das **Organisations-Dashboard**. Wenn die Login-Methode für eine bestimmte Anwendung benötigt wird, öffnen Sie die **Einstellungen dieser Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Create Button](./images/button-create.webp "Create Button").
4. Ein Fenster mit einer Liste von Vorlagen öffnet sich.
5. Wählen Sie die **HOTP**-Vorlage aus.
6. Füllen Sie das Erstellungsformular aus:

   **Basisinformationen**
   - **Name** — Der Name, den die Benutzer sehen werden.
   - **Beschreibung** (optional) — Eine kurze Beschreibung.
   - **Logo** (optional) — Sie können ein eigenes Icon hochladen, andernfalls wird das Standard-Icon verwendet.

   **Parameter**
   - **Anzahl der Ziffern** — Die Anzahl der Ziffern im Einmalpasswort (üblicherweise 6).
   - **Anfangswert des Zählers** — Aktueller Zähler (nicht editierbar).
   - **Algorithmus** — Hashing-Algorithmus (`SHA1`, `SHA256` oder `SHA512`) (üblicherweise `SHA-1`).

   **Erweiterte Einstellungen**
   - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, wenn diese Login-Methode für andere System- (oder Organisations-) Anwendungen sowie für das Benutzerprofil als [externer Service-Identifikator](./docs-12-common-personal-profile.md#external-service-identifiers) verfügbar sein soll.
   - **Öffentlichkeit** — Legen Sie die Standard-Sichtbarkeitsstufe für den externen Service-Identifikator im Benutzerprofil fest.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Login-Methode in der allgemeinen Liste der Provider.

### Schritt 2. Hinzufügen des HOTP-Providers zum Widget

Damit die **HOTP**-Schaltfläche für Benutzer im Autorisierungsformular sichtbar ist, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie die erstellte Login-Methode in der allgemeinen Liste der Provider.
2. Betätigen Sie den Schalter im Provider-Panel.

> **Überprüfung**: Öffnen Sie nach dem Speichern das Login-Formular in einer Testanwendung. Eine neue Schaltfläche mit dem **HOTP**-Logo sollte im Widget erscheinen.

---

## HOTP-Bindung für Benutzer { #hotp-user-binding }

> 📌 Diese Anleitung ist für Benutzer gedacht, die sich via **HOTP** am System anmelden müssen.

### Schritt 1. Installation einer Authenticator-App

Sie müssen eine Anwendung auf Ihrem Mobilgerät installieren, die HOTP-Codes generiert.

Die beliebtesten Optionen sind:

- **Google Authenticator** (Google)

### Schritt 2. Hinzufügen einer HOTP-Kennung zum Profil

1. Gehen Sie zu Ihrem **Profil**.
2. Klicken Sie auf **Hinzufügen** im Block **Identifikatoren**.

<img src="./images/personal-profile-12.webp" alt="Identifier block in the Encvoy ID user profile" style="max-width:600px; width:100%">

3. Wählen Sie im sich öffnenden Fenster die **HOTP**-Login-Methode aus.

4. Scannen Sie den QR-Code mit der Authenticator-App.
5. Geben Sie den Code aus der App ein und bestätigen Sie.

> 💡 **Tipp**: Wenn die Kennung bereits mit einem anderen Benutzer verknüpft ist, müssen Sie diese aus dem Profil dieses Benutzers entfernen, bevor Sie sie mit dem neuen Konto verknüpfen können.

### Schritt 3. Verifizierung

1. Gehen Sie zur Login-Seite, auf der die **HOTP**-Login-Methode aktiviert ist.
2. Wählen Sie das Icon der **HOTP**-Login-Methode aus.
3. Ein Formular zur Code-Eingabe öffnet sich. Öffnen Sie die Authenticator-App auf Ihrem Telefon, ohne die Seite zu schließen.
4. Suchen Sie den Dienst, der **Encvoy ID** (oder dem Anwendungsnamen) entspricht, und geben Sie Ihren Login sowie den 6-stelligen Code in das Feld im Login-Formular ein.
5. Klicken Sie auf die Schaltfläche **Bestätigen**.

---

## Siehe auch

- [Login-Methoden und Konfiguration des Login-Widgets](./docs-06-github-en-providers-settings.md) — ein Leitfaden zu Login-Methoden und zur Konfiguration des Login-Widgets.
- [Organisationsverwaltung](./docs-09-common-mini-widget-settings.md) — ein Leitfaden zur Arbeit mit Organisationen im **Encvoy ID**-System.
- [Persönliches Profil und Verwaltung von Anwendungsberechtigungen](./docs-12-common-personal-profile.md) — ein Leitfaden zur Verwaltung Ihres persönlichen Profils.
