---
title: "mTLS-Login — Verbindung in {{projectName}}"
description: "Erfahren Sie, wie Sie den mTLS-Login in {{projectName}} aktivieren: Erstellen Sie eine Anmeldemethode und fügen Sie diese zum Autorisierungs-Widget hinzu. Verbindung in nur wenigen Schritten."
keywords: 
  - mTLS-Login
  - mTLS-Authentifizierung
  - mTLS-Verbindung
  - mTLS-Konfiguration
  - mTLS {{projectName}}
  - Login über mTLS {{projectName}}
  - mTLS in {{projectName}} einrichten
date: 2025-12-12
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Login über mTLS"
---

# So verbinden Sie den mTLS-Login in {{projectName}}

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Anmeldemethoden. Weitere Details finden Sie im Leitfaden [Anmeldemethoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die **mTLS**-Authentifizierung mit dem **{{projectName}}**-System verbinden.

Die Einrichtung des Logins über **mTLS** besteht aus mehreren wichtigen Phasen:

1. Konfiguration der mTLS-Authentifizierung für **{{projectName}}**-Administratoren

    - [Schritt 1. Nginx für mTLS konfigurieren](#step-1-configure-nginx-for-mtls)
    - [Schritt 2. mTLS-Provider erstellen](#step-2-create-mtls-provider)
    - [Schritt 3. mTLS-Provider zum Widget hinzufügen](#step-3-add-mtls-to-widget)

2. Verknüpfung eines Client-Zertifikats für **{{projectName}}**-Benutzer

    - [Schritt 1. Client-Zertifikat im Browser installieren](#step-1-install-client-certificate)
    - [Schritt 2. Identifikator zum Profil hinzufügen](#step-2-add-identifier-to-profile)
    - [Schritt 3. Überprüfung](#step-3-verify)

---

## Allgemeine Informationen

**mTLS** (Mutual TLS) ist eine Authentifizierungsmethode, die auf der gegenseitigen Überprüfung von Client- und Serverzertifikaten basiert.

Diese Methode bietet ein hohes Maß an Vertrauen und Sicherheit, da eine Systemanmeldung nur möglich ist, wenn der Benutzer im Besitz eines gültigen Zertifikats ist, das von einer vertrauenswürdigen Zertifizierungsstelle (CA) signiert wurde.

**mTLS** ist besonders nützlich für Unternehmens- oder sensible Systeme, bei denen das Risiko eines unbefugten Zugriffs minimiert werden muss.

### mTLS-Workflow

1. **Verbindungsaufbau:** Der Client sendet eine Anfrage an den **{{projectName}}**-Server.
2. **Anforderung des Client-Zertifikats:** Der Server verlangt die Bereitstellung eines Client-Zertifikats.
3. **Senden des Client-Zertifikats:** Der Client stellt sein von einer vertrauenswürdigen CA signiertes Zertifikat bereit.
4. **Zertifikatsprüfung auf dem Server:**

   - Der Server prüft das Zertifikat gegen die Root-CA.
   - Überprüft das Ablaufdatum, die Signatur und die Einhaltung der Sicherheitsanforderungen.

5. **Benutzerauthentifizierung:**

   - Wenn das Zertifikat gültig ist, ordnet der Server es dem Benutzerkonto zu und gewährt Zugriff.
   - Wenn das Zertifikat ungültig ist oder fehlt, wird der Zugriff verweigert.

6. **Aufbau eines sicheren Kanals:** Nach erfolgreicher Zertifikatsprüfung wird eine **verschlüsselte Verbindung** hergestellt und der Benutzer erhält Zugriff.

---

## Konfiguration der mTLS-Authentifizierung für {{projectName}}-Administratoren

Damit **mTLS** funktioniert, müssen Sie:

- den **Nginx**-Webserver so konfigurieren, dass er nur Anfragen akzeptiert, die mit einem vertrauenswürdigen Zertifikat signiert sind;
- den **mTLS**-Provider in der **{{projectName}}**-Oberfläche erstellen und aktivieren;
- Client-Zertifikate auf den Geräten der Benutzer installieren.

### Schritt 1. Nginx für mTLS konfigurieren { #step-1-configure-nginx-for-mtls }

Bevor Sie den Provider in **{{projectName}}** hinzufügen, müssen Sie die **Nginx**-Konfiguration vorbereiten:

1. Öffnen Sie die Konfigurationsdatei `nginx.local.conf`.
2. Fügen Sie einen neuen `server`-Block hinzu:

    **Konfigurationsbeispiel**:

    ```nginx
    server {
       server_name local.trusted.com;
       listen 3443 ssl;

       # Server-Zertifikate
       ssl_certificate         certs/local.trusted.com.pem;
       ssl_certificate_key     certs/local.trusted.com-key.pem;

       # Root-CA-Zertifikat zur Überprüfung der Client-Zertifikate
       ssl_client_certificate  certs/ca-bundle.crt;
       ssl_verify_client on;
       ssl_verify_depth 3;

       # Sitzungs- und Protokolleinstellungen
       ssl_session_timeout 10m;
       ssl_session_cache shared:SSL:10m;
       ssl_protocols TLSv1.2 TLSv1.3;

       # Zugriff auf den Hauptpfad einschränken, mTLS nur für /api/mtls erlaubt
       location / {
           return 404 "mTLS endpoints only. Use port 443 for regular access.";
       }

       # Proxy-Anfrageeinstellungen zum Backend
       location /api/mtls {
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Übertragung von Client-Zertifikatsinformationen
           proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
           proxy_set_header X-SSL-Client-DN $ssl_client_s_dn;
           proxy_set_header X-SSL-Client-Serial $ssl_client_serial;
           proxy_set_header X-SSL-Client-Fingerprint $ssl_client_fingerprint;
           proxy_set_header X-SSL-Client-Issuer $ssl_client_i_dn;

           # Proxying zum Backend
           proxy_pass http://backend;
           proxy_redirect off;
       }
    }
    ```

3. Starten Sie **Nginx** nach den Änderungen neu.

#### Parameterbeschreibung

| Parameter                          | Zweck                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `ssl_certificate`                 | Server-Zertifikat für HTTPS.                                 |
| `ssl_certificate_key`             | Privater Schlüssel des Servers.                              |
| `ssl_client_certificate`          | Root-CA-Zertifikat zur Verifizierung von Client-Zertifikaten. |
| `ssl_verify_client on`            | Aktiviert die obligatorische Client-Zertifikatsprüfung.       |
| `ssl_verify_depth`                | Maximale Tiefe der Client-Zertifikatsprüfungskette.          |
| `ssl_session_timeout`             | Lebensdauer der SSL-Sitzung.                                 |
| `ssl_protocols`                   | Erlaubte TLS-Versionen.                                      |
| `proxy_set_header X-SSL-Client-*` | Übergibt Client-Zertifikatsinformationen an das Backend.     |

- Legen Sie Server-Zertifikate (`.pem` und Key) sowie die Root-CA (`ca-bundle.crt`) in einem geeigneten Verzeichnis ab, z. B. `certs/`.
- Geben Sie den Pfad zu den Zertifikaten in der **Nginx**-Konfiguration an.

### Schritt 2. mTLS-Provider erstellen { #step-2-create-mtls-provider }

1. Gehen Sie zum Admin-Panel → Tab **Einstellungen**.

   > 💡 Um eine Anmeldemethode für eine Organisation zu erstellen, öffnen Sie das **Organisations-Dashboard**. Wenn die Anmeldemethode für eine bestimmte Anwendung benötigt wird, öffnen Sie die **Einstellungen für diese Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Erstellen-Schaltfläche](./images/button-create.webp "Erstellen-Schaltfläche").
4. Ein Fenster mit einer Liste von Vorlagen öffnet sich.
5. Wählen Sie die **mTLS**-Vorlage aus.
6. Füllen Sie das Erstellungsformular aus:

    **Basisinformationen**

    - **Name** — Der Name, den Benutzer sehen werden.
    - **Beschreibung** (optional) — Eine kurze Beschreibung.
    - **Logo** (optional) — Sie können ein eigenes Icon hochladen, andernfalls wird das Standard-Icon verwendet.

    **Zusätzliche Einstellungen**

    - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, damit die Anmeldemethode als [Identifikator für externe Dienste](./docs-12-common-personal-profile.md#external-service-identifiers) zum Benutzerprofil hinzugefügt werden kann.
    - **Öffentlichkeit** — Legen Sie die Standard-Sichtbarkeitsstufe für den Identifikator des externen Dienstes im Benutzerprofil fest.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Anmeldemethode in der allgemeinen Liste der Provider.

### Schritt 3. mTLS-Provider zum Widget hinzufügen { #step-3-add-mtls-to-widget }

Damit Benutzer die **mTLS**-Schaltfläche auf dem Autorisierungsformular sehen, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie die erstellte Anmeldemethode in der allgemeinen Liste der Provider.
2. Betätigen Sie den Schalter auf dem Provider-Panel.

> **Überprüfung**: Öffnen Sie nach dem Speichern das Anmeldeformular in einer Testanwendung. Eine neue Schaltfläche mit dem **mTLS**-Logo sollte im Widget erscheinen.

---

## Verknüpfung eines Client-Zertifikats für {{projectName}}-Benutzer

> 📌 Diese Anleitung richtet sich an Benutzer, die sich über **mTLS** am System anmelden müssen.

### Schritt 1. Client-Zertifikat im Browser installieren { #step-1-install-client-certificate }

Stellen Sie vor der Installation sicher, dass Sie eine Zertifikatsdatei im Format `.p12` oder `.pfx` haben.

Diese Datei muss enthalten:

- Ihr persönliches Zertifikat,
- den privaten Schlüssel,
- und die Vertrauenskette (falls erforderlich).

#### Installation in Google Chrome / Microsoft Edge

1. Öffnen Sie den **Chrome**- oder **Edge**-Browser.
2. Gehen Sie zu **Einstellungen** → **Datenschutz und Sicherheit**.
3. Suchen Sie den Abschnitt **Sicherheit**.
4. Klicken Sie auf **Zertifikate verwalten**.
5. Gehen Sie zum Tab **Eigene Zertifikate** / **Persönlich**.
6. Klicken Sie auf **Importieren...**.
7. Klicken Sie im Import-Assistenten auf **Weiter**.
8. Klicken Sie auf **Durchsuchen** und wählen Sie Ihre `.p12`- oder `.pfx`-Datei aus.
9. Geben Sie das Passwort ein, das Sie mit dem Zertifikat erhalten haben.
10. Wählen Sie **Alle Zertifikate in folgendem Speicher speichern**.
11. Klicken Sie auf **Durchsuchen** und wählen Sie **Eigene Zertifikate**.
12. Klicken Sie auf **Weiter** → **Fertigstellen**.
13. Wenn eine Sicherheitswarnung erscheint, klicken Sie auf **Ja**.

Nach erfolgreicher Installation erscheint das Zertifikat in der Liste auf dem Tab **Eigene Zertifikate**.

#### Installation in Mozilla Firefox

1. Öffnen Sie das **Firefox**-Menü → **Einstellungen**
2. Gehen Sie zum Abschnitt **Datenschutz & Sicherheit**
3. Scrollen Sie nach unten zu **Zertifikate**
4. Klicken Sie auf **Zertifikate anzeigen...**
5. Gehen Sie zum Tab **Ihre Zertifikate**
6. Klicken Sie auf **Importieren...**
7. Wählen Sie Ihre `.p12`- oder `.pfx`-Datei aus
8. Geben Sie das Zertifikatspasswort ein
9. Klicken Sie auf **OK**

Nach erfolgreicher Installation erscheint das Zertifikat in der Liste auf dem Tab **Ihre Zertifikate**.

> ⚠️ Zertifikate sollten nur auf vertrauenswürdigen Geräten installiert werden, und das Passwort muss streng geheim gehalten werden.

> 💡 Nach der Installation des Zertifikats wird der Browser Sie beim Login über **mTLS** automatisch auffordern, das entsprechende Zertifikat für die Authentifizierung auszuwählen.

### Schritt 2. Identifikator zum Profil hinzufügen { #step-2-add-identifier-to-profile }

1. Gehen Sie zu Ihrem **Profil**.
2. Klicken Sie auf **Hinzufügen** im Block **Identifikatoren**.

    <img src="./images/personal-profile-12.webp" alt="Identifikatoren-Block im Benutzerprofil" style="max-width:600px; width:100%">

3. Wählen Sie im sich öffnenden Fenster die **mTLS**-Anmeldemethode aus.
4. Wählen Sie das im vorherigen Schritt installierte Zertifikat aus.

> 💡 **Tipp**: Wenn der Identifikator bereits mit einem anderen Benutzer verknüpft ist, müssen Sie ihn aus dem Profil dieses Benutzers entfernen, bevor Sie ihn mit dem neuen Konto verknüpfen können.

### Schritt 3. Überprüfung { #step-3-verify }

1. Gehen Sie zur Anmeldeseite, auf der die **mTLS**-Anmeldemethode aktiviert ist.
2. Wählen Sie das Icon der **mTLS**-Anmeldemethode.

   - **Erster Login**: Das System fordert Sie möglicherweise auf, ein Client-Zertifikat auszuwählen.
   - **Folgende Logins**: Die Authentifizierung erfolgt automatisch mit dem zuvor ausgewählten Zertifikat.

---

## Siehe auch

- [Anmeldemethoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md) — Leitfaden zu Anmeldemethoden und zur Konfiguration des Login-Widgets.
- [Organisationsverwaltung](./docs-09-common-mini-widget-settings.md) — Leitfaden zur Arbeit mit Organisationen im **{{projectName}}**-System.
- [Persönliches Profil und Verwaltung von App-Berechtigungen](./docs-12-common-personal-profile.md) — Leitfaden zur Verwaltung Ihres persönlichen Profils.