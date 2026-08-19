---
title: "WebAuthn-Login — Verbindung in Encvoy ID"
description: "Erfahren Sie, wie Sie den WebAuthn-Login in Encvoy ID verbinden: Erstellen Sie eine Anmeldemethode und fügen Sie diese zum Autorisierungs-Widget hinzu. Verbindung in nur wenigen Schritten."
keywords:
  - WebAuthn login
  - WebAuthn Authentifizierung
  - WebAuthn Verbindung
  - WebAuthn Einrichtung
  - WebAuthn Encvoy ID
  - Login über WebAuthn Encvoy ID
  - Konfiguration von WebAuthn in Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via WebAuthn"
---

# So verbinden Sie den WebAuthn-Login in Encvoy ID

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Anmeldemethoden. Weitere Details finden Sie im Leitfaden [Anmeldemethoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die **WebAuthn**-Authentifizierung mit dem **Encvoy ID**-System verbinden.

**Inhaltsverzeichnis:**

- [Allgemeine Informationen](#general-info)
- [Konfiguration der WebAuthn-Authentifizierung für Administratoren](#webauthn-admin-setup)
- [Hinzufügen eines Schlüssels für einen Benutzer](#adding-key-for-user)
- [Siehe auch](#see-also)

---

## Allgemeine Informationen { #general-info }

**WebAuthn** (Web Authentication) ist ein Authentifizierungsstandard, der es Benutzern ermöglicht, sich ohne Passwort mit sicheren Verifizierungsmethoden anzumelden:

- Biometrie (Face ID, Touch ID);
- Hardware-Sicherheitsschlüssel;
- Integrierte Sicherheitsmodule von Geräten.

**WebAuthn** ist Teil der **FIDO2**-Spezifikation und wird von allen modernen Browsern unterstützt.

> 🔐 **WebAuthn** kann als primäre Anmeldemethode oder als zusätzlicher Faktor für die Multi-Faktor-Authentifizierung verwendet werden.

### Wie WebAuthn funktioniert

1. **Benutzerregistrierung:**
   - Der Benutzer erstellt einen Authentifizierungsschlüssel.
   - Das Gerät generiert ein Schlüsselpaar: Der öffentliche Schlüssel wird im System gespeichert, während der private Schlüssel ausschließlich beim Benutzer verbleibt.

2. **Einleitung des Logins:**
   - Der Benutzer wählt die **WebAuthn**-Anmeldemethode auf der Webressource aus.
   - Der Server sendet eine Abfrage (`challenge`), um die Identität zu überprüfen.

3. **Benutzerauthentifizierung:**
   - Das Gerät oder der Token signiert die `challenge` mit dem privaten Schlüssel.
   - Der Server verifiziert die Signatur mithilfe des gespeicherten öffentlichen Schlüssels.
   - Wenn die Signatur gültig ist, wird dem Benutzer Zugriff gewährt.

4. **Aufbau eines sicheren Kanals:** Nach erfolgreicher Authentifizierung meldet sich der Benutzer im System an, ohne dass ein Passwort über das Netzwerk übertragen wird.

---

## Konfiguration der WebAuthn-Authentifizierung für Administratoren { #webauthn-admin-setup }

### Schritt 1. Erstellen einer Anmeldemethode

1. Gehen Sie zum Admin-Panel → Tab **Einstellungen**.

   > 💡 Um eine Anmeldemethode für eine Organisation zu erstellen, öffnen Sie das **Organisations-Dashboard**. Wenn die Anmeldemethode für eine bestimmte Anwendung benötigt wird, öffnen Sie die **Einstellungen dieser Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Create Button](./images/button-create.webp "Create Button").
4. Ein Fenster mit einer Liste von Vorlagen wird geöffnet.
5. Wählen Sie die **WebAuthn**-Vorlage aus.
6. Füllen Sie das Erstellungsformular aus:

   **Basisinformationen**
   - **Name** — Der Name, den die Benutzer sehen werden.
   - **Beschreibung** (optional) — Eine kurze Beschreibung.
   - **Logo** (optional) — Sie können ein eigenes Icon hochladen, andernfalls wird das Standard-Icon verwendet.

   **Zusätzliche Einstellungen**
   - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, damit die Anmeldemethode zum Benutzerprofil als [Identifikator eines externen Dienstes](./docs-12-common-personal-profile.md#external-service-identifiers) hinzugefügt werden kann.
   - **Öffentlichkeit** — Legen Sie die Standard-Sichtbarkeitsstufe für den Identifikator des externen Dienstes im Benutzerprofil fest.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Anmeldemethode in der allgemeinen Liste der Provider.

### Schritt 2. Hinzufügen des WebAuthn-Providers zum Widget

Damit die **WebAuthn**-Schaltfläche für Benutzer im Autorisierungsformular sichtbar ist, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie die erstellte Anmeldemethode in der allgemeinen Liste der Provider.
2. Stellen Sie den Schalter im Provider-Panel auf die Position "Ein".

> **Überprüfung**: Öffnen Sie nach dem Speichern das Anmeldeformular in einer Testanwendung. Eine neue Schaltfläche mit dem **WebAuthn**-Logo sollte im Widget erscheinen.

---

## Hinzufügen eines Schlüssels für einen Benutzer { #adding-key-for-user }

### Schritt 1. Hinzufügen eines Schlüssels zum Gerät

Die Registrierung eines **WebAuthn**-Schlüssels ist der Prozess der Erstellung eines öffentlichen und privaten Schlüsselpaars und dessen Verknüpfung mit einem bestimmten Benutzer.

Um den **WebAuthn**-Login zu nutzen, muss der Benutzer zuerst einen Schlüssel registrieren – dies kann ein integrierter Authentifikator (z. B. **Touch ID**, **Face ID** oder **Windows Hello**) oder ein externer physischer Sicherheitsschlüssel sein.

Während des Prozesses zum Hinzufügen des Schlüssels wird ein einzigartiges kryptografisches Paar erstellt – **öffentliche** und **private Schlüssel**.

- Der private Schlüssel wird sicher auf dem Gerät des Benutzers gespeichert und niemals über das Netzwerk übertragen.
- Der öffentliche Schlüssel wird auf dem **Encvoy ID**-Server gespeichert und für die spätere Authentifizierungsprüfung beim Login verwendet.

Nach der Registrierung des Schlüssels muss der Benutzer den **WebAuthn**-Identifikator zu seinem **Encvoy ID**-Profil hinzufügen.

### Schritt 2. Hinzufügen des Identifikators zum Profil

1. Gehen Sie zu Ihrem **Profil**.
2. Klicken Sie auf **Hinzufügen** im Block **Identifikatoren**.

<img src="./images/personal-profile-12.webp" alt="Block Identifikatoren im Benutzerprofil" style="max-width:600px; width:100%">

3. Wählen Sie im sich öffnenden Fenster die **WebAuthn**-Anmeldemethode aus.
4. Geben Sie im Systemdialog den zuvor registrierten Schlüssel an.

> 💡 **Tipp**: Wenn der Identifikator bereits mit einem anderen Benutzer verknüpft ist, muss er aus dem Profil dieses Benutzers entfernt werden, bevor er mit dem neuen Konto verknüpft werden kann.

---

## Siehe auch { #see-also }

- [Anmeldemethoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md) — ein Leitfaden zu Anmeldemethoden und zur Konfiguration des Login-Widgets.
- [Organisationsverwaltung](./docs-09-common-mini-widget-settings.md) — ein Leitfaden zur Arbeit mit Organisationen im **Encvoy ID**-System.
- [Persönliches Profil und Verwaltung von App-Berechtigungen](./docs-12-common-personal-profile.md) — ein Leitfaden zur Verwaltung Ihres persönlichen Profils.
