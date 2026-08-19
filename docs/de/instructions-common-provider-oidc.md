# So verbinden Sie den OpenID Connect Login in Encvoy ID

> 📋 Diese Anleitung ist Teil einer Artikelserie zur Konfiguration von Login-Methoden. Weitere Details finden Sie im Leitfaden [Login-Methoden und Widget-Konfiguration](./docs-06-github-en-providers-settings.md).

In dieser Anleitung erfahren Sie, wie Sie die **OpenID Connect**-Authentifizierung mit dem **Encvoy ID**-System verbinden.

Die Einrichtung des Logins über **OpenID Connect** besteht aus drei wesentlichen Schritten, die in zwei verschiedenen Systemen durchgeführt werden:

- [Schritt 1. Konfiguration auf Seiten des externen Systems](#step-1-configure-external-system)
- [Schritt 2. Erstellen einer Login-Methode](#step-2-create-login-method)
- [Schritt 3. Hinzufügen zum Widget](#step-3-add-to-widget)
- [Beschreibung der Parameter](#parameters-description)
- [Siehe auch](#see-also)

---

<a name="step-1-configure-external-system"></a>

## Schritt 1. Konfiguration auf Seiten des externen Systems

1. Erstellen Sie eine Anwendung im externen Identitätsdienst.
2. Kopieren Sie die Werte der Felder **Application ID/Client ID** und **Secret/Client Secret**. Diese benötigen Sie beim Erstellen der Anwendung in **Encvoy ID**.

---

<a name="step-2-create-login-method"></a>

## Schritt 2. Erstellen einer Login-Methode

1. Gehen Sie zum Admin-Panel → Tab **Einstellungen**.

   > 💡 Um eine Login-Methode für eine Organisation zu erstellen, öffnen Sie das **Organisations-Dashboard**. Wenn die Login-Methode für eine bestimmte Anwendung benötigt wird, öffnen Sie die **Einstellungen dieser Anwendung**.

2. Suchen Sie den Block **Anmeldemethoden** und klicken Sie auf **Konfigurieren**.
3. Klicken Sie im sich öffnenden Fenster auf die Schaltfläche **Erstellen** ![Create Button](./images/button-create.webp "Create Button").
4. Ein Fenster mit einer Liste von Vorlagen öffnet sich.
5. Wählen Sie die Vorlage **OpenID Connect**.
6. Füllen Sie das Erstellungsformular aus:

   **Basisinformationen**
   - **Name** — Der Name, den die Benutzer sehen werden.
   - **Beschreibung** (optional) — Eine kurze Beschreibung.
   - **Logo** (optional) — Sie können ein eigenes Icon hochladen, andernfalls wird das Standard-Icon verwendet.

   **Authentifizierungsparameter**
   - **Client-ID (client_id)** — Fügen Sie die kopierte **Application ID** (`Client ID`) ein.
   - **Client-Geheimnis (client_secret)** — Fügen Sie das kopierte **Secret** (`Client Secret`) ein.
   - **Rücksprung-URL (Redirect URI)** — Dieses Feld wird automatisch basierend auf Ihrer Domain ausgefüllt.
   - **Basisadresse des Autorisierungsservers (issuer)** — Die Adresse des externen Identitätsdienstes.
   - **Autorisierungsendpunkt (authorization_endpoint)** — Die Adresse, an die der Benutzer zur Autorisierung weitergeleitet wird.
   - **Token-Endpunkt (token_endpoint)** — Die Ressource, die die Token-Ausstellung bereitstellt.
   - **Benutzerinfo-Endpunkt (userinfo_endpoint)** — Die Ressource, die Informationen über den aktuellen Benutzer zurückgibt.
   - **Angeforderte Berechtigungen (scopes)** — Eine Liste von Berechtigungen, die vom Identitätsanbieter angefordert werden sollen. Um eine Berechtigung hinzuzufügen, geben Sie deren Namen ein und drücken Sie **Enter**.

   **Zusätzliche Einstellungen**
   - **Öffentliche Anmeldemethode** — Aktivieren Sie dies, wenn diese Login-Methode für andere Anwendungen im System (oder der Organisation) sowie für das Benutzerprofil als [Identifikator für externe Dienste](./docs-12-common-personal-profile.md#external-service-identifiers) verfügbar sein soll.
   - **Öffentlichkeit** — Legen Sie die Standard-Sichtbarkeitsstufe für den Identifikator des externen Dienstes im Benutzerprofil fest.

7. Klicken Sie auf **Erstellen**.

Nach erfolgreicher Erstellung erscheint die neue Login-Methode in der allgemeinen Liste der Anbieter.

---

<a name="step-3-add-to-widget"></a>

## Schritt 3. Hinzufügen zum Widget

Damit die Schaltfläche **Mit OpenID Connect anmelden** auf dem Autorisierungsformular sichtbar ist, müssen Sie diese Funktion in den Widget-Einstellungen aktivieren:

1. Suchen Sie die erstellte Login-Methode in der allgemeinen Liste der Anbieter.
2. Betätigen Sie den Schalter im Anbieter-Panel.

> **Überprüfung**: Öffnen Sie nach dem Speichern das Login-Formular in einer Testanwendung. Eine neue Schaltfläche mit dem **OpenID Connect**-Logo sollte im Widget erscheinen.

---

<a name="parameters-description"></a>

## Beschreibung der Parameter

### Basisinformationen

| Name             | Beschreibung                                                                                          | Typ                     | Limits           |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- | ---------------- |
| **Name**         | Der Name, der in der Benutzeroberfläche des **Encvoy ID**-Dienstes angezeigt wird                     | Text                    | Max. 50 Zeichen  |
| **Beschreibung** | Eine kurze Beschreibung, die in der Benutzeroberfläche des **Encvoy ID**-Dienstes angezeigt wird      | Text                    | Max. 255 Zeichen |
| **Logo**         | Das Bild, das in der Benutzeroberfläche des **Encvoy ID**-Dienstes und im Login-Widget angezeigt wird | JPG, GIF, PNG oder WEBP | Max. Größe: 1 MB |

### Authentifizierungsparameter

| Name                                                 | Parameter                | Beschreibung                                                                                                                                                                 |
| ---------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client-ID (client_id)**                            | `client_id`              | ID der im externen System erstellten Anwendung                                                                                                                               |
| **Client-Geheimnis (client_secret)**                 | `client_secret`          | Dienst-Zugriffsschlüssel der auf der Seite des externen Systems erstellten Anwendung                                                                                         |
| **Rücksprung-URL (Redirect URI)** (nicht editierbar) | `redirect URI`           | Die **Encvoy ID**-Adresse, an die der Benutzer nach der Authentifizierung beim Drittanbieter weitergeleitet wird                                                             |
| **Basisadresse des Autorisierungsservers (issuer)**  | `issuer`                 | Die Adresse des externen Identitätsdienstes                                                                                                                                  |
| **Autorisierungsendpunkt (authorization_endpoint)**  | `authorization_endpoint` | Die Adresse, an die der Benutzer zur Autorisierung weitergeleitet wird                                                                                                       |
| **Token-Endpunkt (token_endpoint)**                  | `token_endpoint`         | Die Ressource, die die Token-Ausstellung bereitstellt                                                                                                                        |
| **Benutzerinfo-Endpunkt (userinfo_endpoint)**        | `userinfo_endpoint`      | Die Ressource, die Informationen über den aktuellen Benutzer zurückgibt                                                                                                      |
| **Angeforderte Berechtigungen (scopes)**             | -                        | Eine Liste von Berechtigungen, die vom Identitätsanbieter angefordert werden sollen. Um eine Berechtigung hinzuzufügen, geben Sie deren Namen ein und drücken Sie **Enter**. |

### Zusätzliche Einstellungen

| Name                           | Beschreibung                                                                                                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Öffentliche Anmeldemethode** | Wenn aktiviert: <br> - Die Login-Methode wird für andere Service-Anwendungen verfügbar. <br> - Die Login-Methode kann als [Identifikator für externe Dienste](./docs-12-common-personal-profile.md#external-service-identifiers) im Benutzerprofil hinzugefügt werden. |
| **Öffentlichkeit**             | Legt die Standard-Sichtbarkeitsstufe für den Identifikator des externen Dienstes im Benutzerprofil fest                                                                                                                                                                |

---

<a name="see-also"></a>

## Siehe auch

- [Login-Methoden und Konfiguration des Login-Widgets](./docs-06-github-en-providers-settings.md) — Leitfaden zu Login-Methoden und zur Einrichtung des Login-Widgets.
- [Organisationsverwaltung](./docs-11-common-org-settings.md) — Leitfaden zur Arbeit mit Organisationen im **Encvoy ID**-System.
- [Persönliches Profil und Verwaltung von Anwendungsberechtigungen](./docs-12-common-personal-profile.md) — Leitfaden zur Verwaltung des persönlichen Profils.
