---
title: "Encvoy ID Mini-widget — Einrichtung und Anpassung"
description: "Erfahren Sie, wie Sie das Encvoy ID Mini-Widget verbinden und konfigurieren: Login-Buttons, Benutzerprofil und benutzerdefinierte Stile. Integrieren Sie die Lösung in Ihr Projekt."
keywords:
  - Encvoy ID mini-widget
  - mini-widget integration
  - mini-widget customization
  - login button styling
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-12
product: [box, github, service]
region: [ru, en]
menu_title: "Mini-Widget Einrichtung"
order: 10
---

# So konfigurieren und verbinden Sie das Encvoy ID Mini-Widget

In dieser Anleitung erfahren Sie, wie Sie das **Encvoy ID** Mini-Widget auf Ihrer Webressource verbinden und konfigurieren. Sie lernen, wie Sie Authentifizierungsparameter, die Anzeige des Benutzerprofils, Login-Buttons und Menüs einrichten sowie das Erscheinungsbild des Widgets an das Design Ihres Projekts anpassen.

**Inhaltsverzeichnis:**

- [Was ist ein Mini-Widget?](#what-is-mini-widget)
- [Widget-Konfiguration](#widget-configuration)
- [Einstellungen für die Profilanzeige](#profile-display-settings)
- [Einstellungen für den Login-Button](#login-button-settings)
- [Parameter für Menü-Buttons](#menu-button-parameters)
- [Styling des Mini-Widgets](#mini-widget-styling)
- [Individuelles Styling von Menü-Buttons](#individual-menu-button-styling)
- [Siehe auch](#see-also)

---

## Was ist ein Mini-Widget? { #what-is-mini-widget }

Ein **Mini-Widget** ist ein Menü, das Benutzerdaten und wesentliche Funktionen enthält. Es bietet Zugriff auf das Profil, das Admin-Panel, Organisationen oder das Small Office sowie den System-Logout. Sie können hier auch eine Anwendung für den Schnellzugriff platzieren. Das Widget öffnet sich beim Klicken auf den Avatar des Benutzers in der oberen rechten Ecke des Bildschirms.

Das Mini-Widget ist eine leichtgewichtige JavaScript-Komponente für die Benutzerauthentifizierung im **Encvoy ID** Service. Es arbeitet auf Basis der OIDC/OAuth2- und PKCE-Standards und kann in beliebige Websites oder Schnittstellen eingebettet werden — von einfachem HTML bis hin zu SPAs auf React- oder Vue-Basis.

> 💡 Um eine Anwendung zum Mini-Widget hinzuzufügen, aktivieren Sie den Schalter **Im Mini-Widget anzeigen** in den [Anwendungseinstellungen](./docs-10-common-app-settings.md).

Widget-Beispiele:

<img src="./images/mini-widget-01.webp" alt="Beispiel für das Mini-Widget-Design in Encvoy ID" style="max-width:600px; width:100%">

---

## Widget-Konfiguration { #widget-configuration }

### Erforderliche Parameter

Für den Basisbetrieb des Widgets müssen drei Schlüsselparameter angegeben werden:

| Parameter     | Typ      | Beschreibung                                     | Beispiel                        |
| ------------- | -------- | ------------------------------------------------ | ------------------------------- |
| `appId`       | `string` | Eindeutige Anwendungs-ID in Trusted              | `"MTnOOTdx85FgNbOFy2nUsH"`      |
| `backendUrl`  | `string` | Ihre Backend-API-URL                             | `"http://localhost:3001"`       |
| `redirectUrl` | `string` | URL für die Weiterleitung nach der Autorisierung | `"http://localhost:3000/login"` |

### Optionale Parameter

Für die erweiterte Konfiguration stehen optionale Parameter zur Verfügung:

| Parameter             | Typ                   | Beschreibung                             | Standardwert                  |
| --------------------- | --------------------- | ---------------------------------------- | ----------------------------- |
| `issuer`              | `string`              | Trusted SSO Server-URL                   | `"https://id.kloud.one"`      |
| `withOutHomePage`     | `boolean`             | Automatische Weiterleitung zur Anmeldung | `false`                       |
| `getTokenEndPoint`    | `string`              | Endpunkt zum Abrufen eines Tokens        | `"/api/oidc/token"`           |
| `getUserInfoEndPoint` | `string`              | Endpunkt zum Abrufen von Benutzerdaten   | `"/api/oidc/me"`              |
| `scopes`              | `string[]`            | OAuth2-Berechtigungen                    | `["openid", "lk", "profile"]` |
| `profile`             | `IProfileConfig`      | Benutzerprofil-Einstellungen             | Siehe Abschnitt unten         |
| `loginButton`         | `ICustomMenuButton`   | Login-Button-Einstellungen               | Siehe Abschnitt unten         |
| `menuButtons`         | `ICustomMenuButton[]` | Array mit zusätzlichen Buttons           | Siehe Abschnitt unten         |
| `customStyles`        | `ICustomStyles`       | Globale Widget-Stile                     | Siehe Abschnitt unten         |

### Beispiel für eine Basisverbindung

```typescript
import { TrustedWidget, TrustedWidgetConfig } from "trusted-widget";

const newConfig: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  issuer: "https://id.kloud.one",
  withOutHomePage: false,
  getTokenEndPoint: "/api/oidc/token",
  getUserInfoEndPoint: "/api/oidc/me",
};

// Verwendung der Komponente
<TrustedWidget config={newConfig} />;
```

---

## Einstellungen für die Profilanzeige { #profile-display-settings }

### Profil-Konfigurationsparameter

Das **Benutzerprofil** ist eine Komponente, die den Avatar und den Benutzernamen enthält.

| Parameter    | Typ                | Beschreibung                                | Standardwert         |
| ------------ | ------------------ | ------------------------------------------- | -------------------- |
| `isHideText` | `boolean`          | Benutzernamen ausblenden                    | `false`              |
| `wrapper`    | `IComponentStyles` | Stile für den Profil-Container (nur Farben) | Siehe Stil-Abschnitt |
| `button`     | `IComponentStyles` | Stile für den Avatar-Button (nur Farben)    | Siehe Stil-Abschnitt |

> ⚠️ **Wichtig:** Für die Profileinstellungen (`profile.wrapper` und `profile.button`) können nur Farben (`color.text`, `color.background`, `color.hover`) geändert und der Benutzername ausgeblendet werden (`isHideText`). Andere Styling-Parameter (wie `borderRadius`, `padding`, `position`) werden nicht auf das Profil angewendet.

### Beispiel für die Profileinrichtung

```typescript
// Beispiel: Nur Avatar ohne Text
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  profile: {
    isHideText: true, // Name ausblenden, nur Avatar zeigen
  },
};
```

---

## Einstellungen für den Login-Button { #login-button-settings }

Der Login-Button wird für nicht autorisierte Benutzer angezeigt. Sie können Text, Icon und Stile anpassen.

### Login-Button-Parameter

| Parameter      | Typ                            | Beschreibung                      | Standardwert         |
| -------------- | ------------------------------ | --------------------------------- | -------------------- |
| `text`         | `string`                       | Text des Login-Buttons            | `"Login"`            |
| `type`         | `string`                       | Button-Typ                        | `"login"`            |
| `icon`         | `string \| React.ReactElement` | Bild-Link oder React-Element      | `null`               |
| `customStyles` | `IComponentStyles`             | Individuelle Stile für den Button | Siehe Stil-Abschnitt |

### Konfigurationsbeispiel

```typescript
// Beispiel: Button mit benutzerdefiniertem Icon
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  loginButton: {
    text: "Login via Trusted",
    type: "login",
    icon: "https://id.kloud.one/favicon.ico", // Benutzerdefiniertes Icon
  },
};
```

```typescript
// Beispiel: Einfacher Text-Button ohne Icon
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  loginButton: {
    text: "Login",
    type: "login",
    customStyles: {
      isHideIcon: true, // Icon ausblenden
    },
  },
};
```

---

## Parameter für Menü-Buttons { #menu-button-parameters }

### Erforderliche Parameter

| Parameter | Typ      | Beschreibung            | Beispiel             |
| --------- | -------- | ----------------------- | -------------------- |
| `text`    | `string` | Angezeigter Button-Name | `"TestService"`      |
| `link`    | `string` | URL der Zielseite       | `"https://test.com"` |

### Optionale Parameter

| Parameter      | Typ                            | Beschreibung                      | Standardwert         |
| -------------- | ------------------------------ | --------------------------------- | -------------------- |
| `icon`         | `string \| React.ReactElement` | Bild-Link oder React-Element      | `null`               |
| `customStyles` | `IComponentStyles`             | Individuelle Stile für den Button | Siehe Stil-Abschnitt |

### Konfigurationsbeispiel

```typescript
import { TrustedWidget, TrustedWidgetConfig } from "trusted-widget";

const newConfig: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  menuButtons: [
    {
      text: "TestService",
      link: "https://test.com",
      icon: "https://image.png", // | <Icon />
    },
  ],
};
```

---

## Styling des Mini-Widgets { #mini-widget-styling }

Das Widget unterstützt eine detaillierte Anpassung des Erscheinungsbilds über das `customStyles`-Objekt. Sie können Farben, Eckenradien, Abstände und die Ausrichtung für alle Elemente steuern.

### Struktur des Stil-Objekts

```typescript
customStyles: {
  global: {
    borderRadius: "8px",        // Globaler Eckenradius
    color: { /* Farben */ }      // Globale Farben
  },
  components: {
    primaryButton: { /* Stile */ },   // Primäre Buttons
    secondaryButton: { /* Stile */ }, // Sekundäre Buttons
    accountButton: { /* Stile */ }    // Account-Menü-Buttons
  }
}
```

### Parameter für benutzerdefinierte Stile

#### Globale Stile

| Parameter             | Typ                | Beschreibung                  | Beispiel    |
| --------------------- | ------------------ | ----------------------------- | ----------- |
| `global.borderRadius` | `string`           | Eckenradius für alle Elemente | `"12px"`    |
| `global.color`        | `IComponentStyles` | Globale Farben                | Siehe unten |

#### Komponenten-Stile

| Parameter                    | Typ                | Beschreibung                  | Zweck                    |
| ---------------------------- | ------------------ | ----------------------------- | ------------------------ |
| `components.primaryButton`   | `IComponentStyles` | Stil für primäre Buttons      | "Login", "Profil" Button |
| `components.secondaryButton` | `IComponentStyles` | Stil für sekundäre Buttons    | "Logout" Button          |
| `components.accountButton`   | `IComponentStyles` | Stil für Account-Menü-Buttons | Buttons im Dropdown-Menü |

#### IComponentStyles Parameter für Komponenten-Stile

| Parameter          | Typ                  | Beschreibung                 | Beispiel     |
| ------------------ | -------------------- | ---------------------------- | ------------ |
| `color.text`       | `string`             | Text- und Icon-Farbe (HEX)   | `"#ffffff"`  |
| `color.background` | `string`             | Hintergrundfarbe (HEX)       | `"#1976d2"`  |
| `color.hover`      | `string`             | Hover-Hintergrundfarbe (HEX) | `"#1565c0"`  |
| `borderRadius`     | `string`             | Eckenradius des Elements     | `"8px"`      |
| `padding`          | `string`             | Innenabstand                 | `"8px 16px"` |
| `position`         | `"left" \| "center"` | Inhaltsausrichtung im Button | `"center"`   |
| `isHideIcon`       | `boolean`            | Icon im Button ausblenden    | `false`      |

#### Stil-Vererbung

Das Widget verfügt über ein intelligentes Vererbungssystem für den `secondaryButton`:

- **Wenn Stile nur für `primaryButton` gesetzt sind**, werden diese automatisch auf den `secondaryButton` angewendet, jedoch mit erhöhter Transparenz (über reduzierte Deckkraft).
- **Wenn separate Stile für `secondaryButton` gesetzt sind**, wird keine Transparenz angewendet — es werden nur die explizit angegebenen Parameter verwendet.

### Beispiel für die Stil-Konfiguration

#### Beispiel für die Einrichtung globaler Stile

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Standardwerte für globale Stile
  customStyles: {
    global: {
      color: {
        text: "#666666",
        background: "#ffffff",
      },
      borderRadius: "8px",
    },
    components: {
      accountButton: {
        color: {
          text: "#fff",
          background: "#efefef",
          hover: undefined, // falls nicht gesetzt, wird filter: brightness(90%) angewendet
        },
        position: "left",
        isHideIcon: false,
      },
      primaryButton: {
        color: {
          text: "#ffffff",
          background: "#b5262f",
          hover: undefined, // falls nicht gesetzt, wird filter: brightness(90%) angewendet
        },
        position: "left",
        isHideIcon: false,
      },
      // secondaryButton nicht gesetzt — primaryButton-Stil mit Transparenz (opacity:0.5) wird verwendet
    },
  },
};
```

#### Beispiel für eine vollständige Stil-Konfiguration

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Profileinstellungen
  profile: {
    isHideText: false,
    wrapper: {
      color: {
        text: "#333333",
        background: "#f8f9fa",
      },
    },
    button: {
      color: {
        text: "#333333",
        background: "transparent",
        hover: "rgba(0, 0, 0, 0.08)",
      },
    },
  },
};
```

#### Beispiel für eine vollständige Konfiguration mit Login-Button

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Login-Button mit Icon
  loginButton: {
    text: "Login",
    type: "login",
    icon: "https://id.kloud.one/favicon.ico",
    customStyles: {
      color: {
        text: "#ffffff",
        background: "#4CAF50",
        hover: "#45a049",
      },
      borderRadius: "8px",
      padding: "10px 20px",
    },
  },
};
```

#### Beispiel für eine vollständige Konfiguration mit globalen Stilen und Menü

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Globale Stile
  customStyles: {
    global: {
      borderRadius: "8px",
    },
    components: {
      primaryButton: {
        color: {
          text: "#ffffff",
          background: "#4CAF50",
          hover: "#45a049",
        },
        position: "center",
        isHideIcon: false,
      },
      secondaryButton: {
        color: {
          text: "#4CAF50",
          background: "transparent",
          hover: "#f1f8e9",
        },
        position: "center",
        isHideIcon: false,
      },
      accountButton: {
        color: {
          text: "#333333",
          background: "#ffffff",
          hover: "#f5f5f5",
        },
        position: "left",
        isHideIcon: false,
      },
    },
  },
};
```

---

## Individuelles Styling von Menü-Buttons { #individual-menu-button-styling }

Für jeden Button in `menuButtons` können Sie individuelle Stile über die Eigenschaft `customStyles` vom Typ `IComponentStyles` festlegen.

### Beispiel mit individuellen Button-Stilen

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  menuButtons: [
    {
      text: "Persönlicher Account",
      link: "https://my-account.com",
      icon: "https://icons.com/profile.png",
      customStyles: {
        color: {
          text: "#ffffff",
          background: "#4CAF50", // Grüner Hintergrund
          hover: "#45a049", // Dunkelgrün bei Hover
        },
        borderRadius: "8px",
        padding: "8px 16px",
        position: "center",
      },
    },
    {
      text: "Einstellungen",
      link: "https://settings.com",
      icon: "https://icons.com/settings.png",
      customStyles: {
        color: {
          text: "#333333",
          background: "#f5f5f5", // Hellgrauer Hintergrund
          hover: "#e0e0e0", // Grau bei Hover
        },
        borderRadius: "6px",
        padding: "6px 12px",
        position: "left",
      },
    },
    {
      text: "Support",
      link: "https://support.com",
      customStyles: {
        color: {
          text: "#ffffff",
          background: "#FF5722", // Oranger Hintergrund
          hover: "#E64A19", // Dunkelorange bei Hover
        },
        borderRadius: "4px",
        padding: "10px 20px",
        position: "center",
        isHideIcon: true, // Icon für diesen Button ausblenden
      },
    },
  ],
};
```

### Priorität der Stil-Anwendung

1. **Individuelle Button-Stile** (`customStyles` im Button-Objekt) — höchste Priorität
2. **accountButton-Stile** (`customStyles.components.accountButton`) — falls keine individuellen Stile gesetzt sind
3. **Standard-Stile** — falls keine der vorherigen gesetzt sind

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Wenn ein Button KEINE customStyles hat, werden accountButton-Stile auf menuButtons angewendet
  customStyles: {
    components: {
      // Standard-accountButton-Stile
      accountButton: {
        color: {
          text: "#666666",
          background: "#efefef",
          hover: undefined, // falls nicht gesetzt, wird filter: brightness(90%) angewendet
        },
        position: "left",
      },
    },
  },
};
```

### Prinzipien des Mini-Widget-Stylings

| Prinzip                         | Bedeutung                                                                                          | Anwendung                                                                                                                                                                                                                                      |
| :------------------------------ | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zentralisierte Verwaltung**   | Alle Erscheinungsbild-Einstellungen werden über drei Hauptkonfigurationsobjekte definiert.         | Konfigurieren Sie das allgemeine Aussehen in `customStyles`, das Profil in `profile` und den Login-Button in `loginButton`.                                                                                                                    |
| **Flexible Profil-Einrichtung** | Das Aussehen des Blocks mit Name und Avatar des autorisierten Benutzers wird separat konfiguriert. | Verwenden Sie `profile.wrapper` für den Hintergrund und `profile.button` für den Avatar-Button. Beachten Sie, dass hier nur Farbeinstellungen funktionieren.                                                                                   |
| **Login-Button-Einrichtung**    | Stile für den Button, den nicht autorisierte Benutzer sehen, werden unabhängig konfiguriert.       | Definieren Sie Text, Icon und Stile im `loginButton`-Objekt und dessen `customStyles`-Eigenschaft.                                                                                                                                             |
| **Farbstruktur**                | Das Farbschema für jedes Element wird einheitlich beschrieben.                                     | Verwenden Sie immer ein verschachteltes `color`-Objekt mit den Feldern `text`, `background` und `hover` (z.B. `color: {text: "#fff", background: "#1976d2"}`).                                                                                 |
| **Anzeigeverwaltung**           | Textbeschriftungen oder Icons können einfach ausgeblendet werden.                                  | Verwenden Sie die Flags `isHideText` (Text ausblenden) und `isHideIcon` (Icon ausblenden) in den Komponentenstilen.                                                                                                                            |
| **Flexible Ausrichtung**        | Inhalte innerhalb von Buttons können linksbündig oder zentriert ausgerichtet werden.               | Setzen Sie die Eigenschaft `position: "left"` oder `position: "center"` in den Stilen des gewünschten Buttons.                                                                                                                                 |
| **Intelligente Vererbung**      | Das System füllt Konfigurationslücken mit logischen Standardwerten.                                | - Für `secondaryButton`: Falls keine Stile gesetzt sind, erbt er vom `primaryButton` mit zusätzlicher Transparenz.<br>- Für `hover`: Falls keine Farbe angegeben ist, wird `filter: brightness(90%)` auf den Hintergrund bei Hover angewendet. |
| **Fallback-System**             | Buttons im Dropdown-Menü verwenden allgemeine Stile, wenn keine individuellen gesetzt sind.        | Wenn ein Button in `menuButtons` keine eigenen `customStyles` hat, werden automatisch die Stile von `accountButton` angewendet.                                                                                                                |
| **Globaler Eckenradius**        | Ein einzelner Eckenradius-Wert kann für alle Widget-Elemente festgelegt werden.                    | Geben Sie `customStyles.global.borderRadius` an (z.B. `"8px"`), und dies wirkt sich auf Buttons und Modalfenster aus.                                                                                                                          |
| **Individuelle Anpassung**      | Jeder Button im Menü kann komplett einzigartig gestaltet werden.                                   | Fügen Sie ein `customStyles`-Objekt für ein spezifisches Element im `menuButtons`-Array hinzu.                                                                                                                                                 |

---

## Siehe auch { #see-also }

- [Anwendungsverwaltung](./docs-10-common-app-settings.md) — Leitfaden zum Erstellen, Konfigurieren und Verwalten von OAuth 2.0- und OpenID Connect (OIDC)-Anwendungen.
- [Organisationsverwaltung](./docs-11-common-org-settings.md) — Leitfaden für die Arbeit mit Organisationen in **Encvoy ID**.
- [Verwaltung des persönlichen Profils und der App-Berechtigungen](./docs-12-common-personal-profile.md) — Leitfaden zur Verwaltung Ihres persönlichen Profils.
