---
title: "TOTP-Login — Verbindung und Konfiguration in Encvoy ID"
description: "Erfahren Sie, wie Sie den TOTP-Login in Encvoy ID aktivieren: Erstellen Sie eine Anmeldemethode, fügen Sie diese zum Autorisierungs-Widget hinzu und gewährleisten Sie einen sicheren Zugriff für Benutzer."
keywords:
  # Main actions
  - HOTP-Login
  - HOTP-Authentifizierung
  - HOTP-Konfiguration
  - HOTP-Verbindung
  - Anmeldung über HOTP
  - HOTP Zwei-Faktor-Authentifizierung
  - HOTP Encvoy ID
  - Anmeldung über HOTP Encvoy ID
  - HOTP-Einrichtung in Encvoy ID
  - Unterschied zwischen HOTP und TOTP
  - HOTP
  - HMAC-basiertes Einmalpasswort
  - HMAC-based One-Time Password
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "TOTP-Login"
---

# So verbinden Sie den TOTP-Login in Encvoy ID

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Anmeldemethoden. Weitere Details finden Sie im Leitfaden [Anmeldemethoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die **TOTP**-Einmalpasswort-Authentifizierung mit dem **Encvoy ID**-System verbinden.

Für wen diese Anleitung gedacht ist:

- **Administratoren** — zur Konfiguration der Anmeldemethode im System.
- **Benutzer** — zur Verknüpfung von **TOTP** mit ihrem Profil.

Die Einrichtung des **TOTP**-Logins besteht aus mehreren wichtigen Phasen:

- [Authentifizierungs-Setup für Administratoren](#admin-authentication-setup)
- [TOTP-Bindung für Benutzer](#totp-user-binding)

---

## Allgemeine Informationen

**TOTP** (Time-based One-Time Password) ist ein Algorithmus zur Generierung von Einmalpasswörtern, die für einen kurzen Zeitraum gültig sind.

> 💡 Um eine Anmeldemethode auf Basis von **HOTP** zu erstellen, verwenden Sie die Anleitung [So verbinden Sie den HOTP-Login](./instructions-common-provider-hotp.md).

Der Hauptunterschied zwischen **TOTP** und **HOTP** besteht darin, dass die Passwortgenerierung auf der aktuellen Zeit basiert. In der Regel wird kein exakter Zeitstempel verwendet, sondern das aktuelle Intervall mit vordefinierten Grenzen (typischerweise 30 Sekunden).

**Hauptkomponenten:**

- **Authentifizierungsserver** — der Server, der den geheimen Schlüssel generiert und die eingegebenen Codes verifiziert.
- **Authenticator** — eine Anwendung, die den geheimen Schlüssel speichert und das aktuelle OTP generiert.
- **Geheimer Schlüssel (Secret Key)** — eine gemeinsame Basis zwischen dem Server und der Anwendung, die zur Codegenerierung verwendet wird.

### TOTP-Workflow

1. **Vorläufige Einrichtung**
   - Der Administrator erstellt eine **TOTP**-Anmeldemethode und aktiviert diese für die Widgets der erforderlichen Anwendungen.
   - Der Benutzer fügt eine neue **TOTP**-Kennung in seinem Profil hinzu, indem er einen QR-Code, der den geheimen Schlüssel enthält, über eine Authenticator-App scannt.

2. **Codegenerierung und Verifizierung**
   - Die Authenticator-App berechnet ein Einmalpasswort basierend auf dem geheimen Schlüssel und dem aktuellen Zeitintervall (meist 30 Sekunden) unter Verwendung des `SHA1`-, `SHA256`- oder `SHA512`-Algorithmus.
   - Wenn der Benutzer den Code im Anmeldeformular eingibt, berechnet der Server den erwarteten Code mit demselben Geheimnis und der aktuellen Zeit neu.
   - Wenn der eingegebene Code mit dem erwarteten übereinstimmt, wird dem Benutzer Zugriff gewährt.

> 🚨 **Wichtig**: Die Zeit auf dem Gerät des Benutzers und dem Server muss synchronisiert sein. Zeitabweichungen sind der häufigste Grund für die Ablehnung von Codes. Um kleine Zeitunterschiede auszugleichen, kann der Server Codes aus benachbarten Zeitintervallen akzeptieren (normalerweise ±1 Intervall).

---

## Authentifizierungs-Setup für Administratoren { #admin-authentication-setup }

### Schritt 1. Erstellen einer Anmeldemethode

1. Gehen Sie zum Admin-Panel → Registerkarte **Einstellungen**.

   > 💡 Um eine Anmeldemethode für eine Organisation zu erstellen, öffnen Sie das **Organisations-Dashboard**. Wenn die Anmeldemethode für eine bestimmte Anwendung benötigt wird, öffnen Sie **die Einstellungen dieser Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Create Button](./images/button-create.webp "Create Button").
4. Ein Fenster mit einer Liste von Vorlagen wird geöffnet.
5. Wählen Sie die **TOTP**-Vorlage aus.
6. Füllen Sie das Erstellungsformular aus:

   **Basisinformationen**
   - **Name** — Der Name, den die Benutzer sehen werden.
   - **Beschreibung** (optional) — Eine kurze Beschreibung.
   - **Logo** (optional) — Sie können ein eigenes Symbol hochladen, andernfalls wird das Standardsymbol verwendet.

   **Parameter**
   - **Anzahl der Ziffern** — Anzahl der Stellen im Einmalpasswort (normalerweise 6).
   - **Gültigkeitszeitraum** — Gültigkeitsdauer des Einmalpassworts in Sekunden (30 wird empfohlen).
   - **Algorithmus** — Hashing-Algorithmus (`SHA1`, `SHA256` oder `SHA512`) (normalerweise `SHA-1`).

   **Zusätzliche Einstellungen**
   - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, wenn diese Anmeldemethode für andere System- (oder Organisations-) Anwendungen sowie für das Benutzerprofil als [Kennung eines externen Dienstes](./docs-12-common-personal-profile.md#external-service-identifiers) verfügbar sein soll.
   - **Öffentlichkeit** — Konfigurieren Sie die Standard-Sichtbarkeitsstufe für die Kennung des externen Dienstes im Benutzerprofil.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Anmeldemethode in der allgemeinen Liste der Provider.

### Schritt 2. Hinzufügen des TOTP-Providers zum Widget

Damit Benutzer die **TOTP**-Schaltfläche auf dem Autorisierungsformular sehen, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie die erstellte Anmeldemethode in der allgemeinen Liste der Provider.
2. Stellen Sie den Schalter am Provider-Panel auf die Position "Ein".

> **Überprüfung**: Öffnen Sie nach dem Speichern das Anmeldeformular in einer Testanwendung. Eine neue Schaltfläche mit dem **TOTP**-Logo sollte auf dem Widget erscheinen.

---

## TOTP-Bindung für Benutzer { #totp-user-binding }

> 📌 Diese Anleitung richtet sich an Benutzer, die sich über **TOTP** am System anmelden müssen.

### Schritt 1. Installation einer Authenticator-App

Sie müssen eine Anwendung auf Ihrem Mobilgerät installieren, die TOTP-Codes generiert.

Die beliebtesten Optionen sind:

- **Google Authenticator** (Google)

> 💡 Stellen Sie sicher, dass die Zeit auf Ihrem Mobilgerät so eingestellt ist, dass sie automatisch (über das Netzwerk) aktualisiert wird. Eine falsche Uhrzeit ist der häufigste Grund, warum Codes nicht akzeptiert werden.

### Schritt 2. Hinzufügen einer TOTP-Kennung zum Profil

1. Gehen Sie zu Ihrem **Profil**.
2. Klicken Sie im Block **Identifikatoren** auf **Hinzufügen**.

<img src="./images/personal-profile-12.webp" alt="Identifier block in Encvoy ID user profile" style="max-width:600px; width:100%">

3. Wählen Sie im sich öffnenden Fenster die **TOTP**-Anmeldemethode aus.
4. Scannen Sie den QR-Code mit Ihrer Authenticator-App.

<img src="./images/instructions-provider-totp-02.webp" alt="Dialog for adding a TOTP identifier in Encvoy ID user profile" style="max-width:400px; width:100%">

5. Geben Sie den Code aus der App ein und bestätigen Sie.

> 💡 **Tipp**: Wenn die Kennung bereits mit einem anderen Benutzer verknüpft ist, müssen Sie diese aus dem Profil dieses Benutzers entfernen, bevor Sie sie mit dem neuen Konto verknüpfen können.

### Schritt 3. Verifizierung

1. Rufen Sie die Anmeldeseite auf, auf der die **TOTP**-Anmeldemethode aktiviert ist.
2. Wählen Sie das Symbol für die **TOTP**-Anmeldemethode.
3. Ein Formular zur Eingabe des Codes wird geöffnet.
4. Geben Sie Ihren Login ein.

<img src="./images/instructions-provider-totp-03.webp" alt="Example of login widget for TOTP identifier in Encvoy ID" style="max-width:300px; width:100%">

5. Öffnen Sie, ohne die Seite zu schließen, die Authenticator-App auf Ihrem Telefon. Kopieren Sie den 6-stelligen Code und fügen Sie ihn in das Formular ein.

6. Klicken Sie auf die Schaltfläche **Bestätigen**.

> 🔄 **Falls der Code nicht akzeptiert wird**: Stellen Sie sicher, dass die Zeit auf Ihrem Telefon und dem Server synchronisiert ist. Versuchen Sie, auf die Generierung des nächsten Codes zu warten (ein neuer erscheint alle 30 Sekunden). Wenn das Problem weiterhin besteht, wenden Sie sich an Ihren Administrator.

---

## Siehe auch

- [Anmeldemethoden und Konfiguration des Login-Widgets](./docs-06-github-en-providers-settings.md) — ein Leitfaden zu Anmeldemethoden und Widget-Einrichtung.
- [Organisationsverwaltung](./docs-09-common-mini-widget-settings.md) — ein Leitfaden für die Arbeit mit Organisationen im **Encvoy ID**-System.
- [Persönliches Profil und Verwaltung von App-Berechtigungen](./docs-12-common-personal-profile.md) — ein Leitfaden zur Verwaltung Ihres persönlichen Profils.
