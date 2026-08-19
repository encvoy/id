---
title: "Encvoy ID Mini-widget — Configurazione e Personalizzazione"
description: "Scopri come collegare e configurare il mini-widget Encvoy ID: pulsanti di login, profilo utente e stili personalizzati. Integra la soluzione nel tuo progetto."
keywords:
  - Encvoy ID mini-widget
  - integrazione mini-widget
  - personalizzazione mini-widget
  - styling pulsante login
author: "Team Encvoy ID"
date: 2025-12-12
updated: 2025-12-12
product: [box, github, service]
region: [ru, en]
menu_title: "Configurazione Mini-widget"
order: 10
---

# Come Configurare e Collegare il Mini-widget Encvoy ID

In questa guida imparerai come collegare e configurare il mini-widget **Encvoy ID** sulla tua risorsa web. Imparerai a impostare i parametri di autenticazione, la visualizzazione del profilo utente, i pulsanti di login e i menu, oltre a personalizzare l'aspetto del widget per armonizzarlo con il design del tuo progetto.

**Sommario:**

- [Cos'è un mini-widget?](#what-is-mini-widget)
- [Configurazione del Widget](#widget-configuration)
- [Impostazioni Visualizzazione Profilo](#profile-display-settings)
- [Impostazioni Pulsante Login](#login-button-settings)
- [Parametri Pulsanti Menu](#menu-button-parameters)
- [Styling del Mini-widget](#mini-widget-styling)
- [Styling Individuale dei Pulsanti Menu](#individual-menu-button-styling)
- [Vedi Anche](#see-also)

---

## Cos'è un mini-widget? { #what-is-mini-widget }

Un **mini-widget** è un menu contenente i dati dell'utente e le funzioni essenziali. Fornisce l'accesso al profilo, al pannello di amministrazione, alle organizzazioni o al piccolo ufficio e al logout dal sistema. Puoi anche inserire qui un'applicazione per un accesso rapido. Il widget si apre cliccando sull'avatar dell'utente nell'angolo in alto a destra dello schermo.

Il mini-widget è un componente JavaScript leggero per l'autenticazione utente nel servizio **Encvoy ID**. Funziona sulla base degli standard OIDC/OAuth2 e PKCE e può essere incorporato in qualsiasi sito web o interfaccia — dal semplice HTML alle SPA su React o Vue.

> 💡 Per aggiungere un'applicazione al mini-widget, attiva l'interruttore **Mostra nel mini-widget** nelle [impostazioni dell'applicazione](./docs-10-common-app-settings.md).

Esempi di widget:

<img src="./images/mini-widget-01.webp" alt="Esempio di design mini-widget in Encvoy ID" style="max-width:600px; width:100%">

---

## Configurazione del Widget { #widget-configuration }

### Parametri Obbligatori

Per il funzionamento base del widget, devono essere specificati tre parametri chiave:

| Parametro     | Tipo     | Descrizione                                         | Esempio                         |
| ------------- | -------- | --------------------------------------------------- | ------------------------------- |
| `appId`       | `string` | Identificatore univoco dell'applicazione in Trusted | `"MTnOOTdx85FgNbOFy2nUsH"`      |
| `backendUrl`  | `string` | URL della tua API backend                           | `"http://localhost:3001"`       |
| `redirectUrl` | `string` | URL per il reindirizzamento dopo l'autorizzazione   | `"http://localhost:3000/login"` |

### Parametri Opzionali

Sono disponibili parametri opzionali per la configurazione avanzata:

| Parametro             | Tipo                  | Descrizione                                    | Valore Predefinito            |
| --------------------- | --------------------- | ---------------------------------------------- | ----------------------------- |
| `issuer`              | `string`              | URL del server Trusted SSO                     | `"https://id.kloud.one"`      |
| `withOutHomePage`     | `boolean`             | Reindirizzamento automatico all'autorizzazione | `false`                       |
| `getTokenEndPoint`    | `string`              | Endpoint per ottenere un token                 | `"/api/oidc/token"`           |
| `getUserInfoEndPoint` | `string`              | Endpoint per ottenere i dati utente            | `"/api/oidc/me"`              |
| `scopes`              | `string[]`            | Permessi OAuth2                                | `["openid", "lk", "profile"]` |
| `profile`             | `IProfileConfig`      | Impostazioni profilo utente                    | Vedi sezione sotto            |
| `loginButton`         | `ICustomMenuButton`   | Impostazioni pulsante login                    | Vedi sezione sotto            |
| `menuButtons`         | `ICustomMenuButton[]` | Array di pulsanti aggiuntivi                   | Vedi sezione sotto            |
| `customStyles`        | `ICustomStyles`       | Stili globali del widget                       | Vedi sezione sotto            |

### Esempio di Collegamento Base

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

// Utilizzo del componente
<TrustedWidget config={newConfig} />;
```

---

## Impostazioni Visualizzazione Profilo { #profile-display-settings }

### Parametri di Configurazione Profilo

Il **Profilo Utente** è un componente che contiene l'avatar e il nome utente.

| Parametro    | Tipo               | Descrizione                                 | Valore Predefinito |
| ------------ | ------------------ | ------------------------------------------- | ------------------ |
| `isHideText` | `boolean`          | Nascondi la visualizzazione del nome utente | `false`            |
| `wrapper`    | `IComponentStyles` | Stili contenitore profilo (solo colori)     | Vedi sezione stili |
| `button`     | `IComponentStyles` | Stili pulsante avatar utente (solo colori)  | Vedi sezione stili |

> ⚠️ **Importante:** Per le impostazioni del profilo (`profile.wrapper` e `profile.button`), possono essere modificati solo i colori (`color.text`, `color.background`, `color.hover`) e può essere nascosto il nome utente (`isHideText`). Altri parametri di styling (come `borderRadius`, `padding`, `position`) non vengono applicati al profilo.

### Esempio Configurazione Profilo

```typescript
// Esempio: Solo avatar senza testo
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  profile: {
    isHideText: true, // Nascondi nome, mostra solo avatar
  },
};
```

---

## Impostazioni Pulsante Login { #login-button-settings }

Il pulsante di login viene visualizzato per gli utenti non autorizzati. Puoi personalizzarne il testo, l'icona e gli stili.

### Parametri Pulsante Login

| Parametro      | Tipo                           | Descrizione                       | Valore Predefinito |
| -------------- | ------------------------------ | --------------------------------- | ------------------ |
| `text`         | `string`                       | Testo pulsante login              | `"Login"`          |
| `type`         | `string`                       | Tipo di pulsante                  | `"login"`          |
| `icon`         | `string \| React.ReactElement` | Link immagine o elemento React    | `null`             |
| `customStyles` | `IComponentStyles`             | Stili individuali per il pulsante | Vedi sezione stili |

### Esempio di Configurazione

```typescript
// Esempio: Pulsante con icona personalizzata
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  loginButton: {
    text: "Login via Trusted",
    type: "login",
    icon: "https://id.kloud.one/favicon.ico", // Icona personalizzata
  },
};
```

```typescript
// Esempio: Semplice pulsante di testo senza icona
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  loginButton: {
    text: "Login",
    type: "login",
    customStyles: {
      isHideIcon: true, // Nascondi icona
    },
  },
};
```

---

## Parametri Pulsanti Menu { #menu-button-parameters }

### Parametri Obbligatori

| Parametro | Tipo     | Descrizione                      | Esempio              |
| --------- | -------- | -------------------------------- | -------------------- |
| `text`    | `string` | Nome del pulsante visualizzato   | `"TestService"`      |
| `link`    | `string` | URL della pagina di destinazione | `"https://test.com"` |

### Parametri Opzionali

| Parametro      | Tipo                           | Descrizione                       | Valore Predefinito |
| -------------- | ------------------------------ | --------------------------------- | ------------------ |
| `icon`         | `string \| React.ReactElement` | Link immagine o elemento React    | `null`             |
| `customStyles` | `IComponentStyles`             | Stili individuali per il pulsante | Vedi sezione stili |

### Esempio di Configurazione

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

## Styling del Mini-widget { #mini-widget-styling }

Il widget supporta una personalizzazione dettagliata dell'aspetto tramite l'oggetto `customStyles`. Puoi controllare colori, raggi dei bordi, padding e allineamento per tutti gli elementi.

### Struttura Oggetto Style

```typescript
customStyles: {
  global: {
    borderRadius: "8px",        // Raggio bordo globale
    color: { /* colori */ }      // Colori globali
  },
  components: {
    primaryButton: { /* stili */ },   // Pulsanti primari
    secondaryButton: { /* stili */ }, // Pulsanti secondari
    accountButton: { /* stili */ }    // Pulsanti menu account
  }
}
```

### Parametri Custom Style

#### Stili Globali

| Parametro             | Tipo               | Descrizione                          | Esempio    |
| --------------------- | ------------------ | ------------------------------------ | ---------- |
| `global.borderRadius` | `string`           | Raggio angoli per tutti gli elementi | `"12px"`   |
| `global.color`        | `IComponentStyles` | Colori globali                       | Vedi sotto |

#### Stili Componenti

| Parametro                    | Tipo               | Descrizione                 | Scopo                       |
| ---------------------------- | ------------------ | --------------------------- | --------------------------- |
| `components.primaryButton`   | `IComponentStyles` | Stile pulsante primario     | Pulsante "Login", "Profilo" |
| `components.secondaryButton` | `IComponentStyles` | Stile pulsante secondario   | Pulsante "Logout"           |
| `components.accountButton`   | `IComponentStyles` | Stile pulsante menu account | Pulsanti nel menu a tendina |

#### Parametri Stile Componente IComponentStyles

| Parametro          | Tipo                 | Descrizione                      | Esempio      |
| ------------------ | -------------------- | -------------------------------- | ------------ |
| `color.text`       | `string`             | Colore testo e icona (HEX)       | `"#ffffff"`  |
| `color.background` | `string`             | Colore di sfondo (HEX)           | `"#1976d2"`  |
| `color.hover`      | `string`             | Colore sfondo al passaggio (HEX) | `"#1565c0"`  |
| `borderRadius`     | `string`             | Raggio angoli elemento           | `"8px"`      |
| `padding`          | `string`             | Padding interno                  | `"8px 16px"` |
| `position`         | `"left" \| "center"` | Allineamento contenuto pulsante  | `"center"`   |
| `isHideIcon`       | `boolean`            | Nascondi icona nel pulsante      | `false`      |

#### Ereditarietà degli Stili

Il widget presenta un sistema intelligente di ereditarietà degli stili per il `secondaryButton`:

- **Se gli stili sono impostati solo per `primaryButton`**, vengono applicati automaticamente a `secondaryButton`, ma con una trasparenza aumentata (tramite opacità ridotta).
- **Se sono impostati stili separati per `secondaryButton`**, la trasparenza non viene applicata — vengono utilizzati solo i parametri esplicitamente specificati.

### Esempio Configurazione Stili

#### Esempio Impostazione Stile Globale

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Valori predefiniti per stili globali
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
          hover: undefined, // se non impostato, viene applicato filter: brightness(90%)
        },
        position: "left",
        isHideIcon: false,
      },
      primaryButton: {
        color: {
          text: "#ffffff",
          background: "#b5262f",
          hover: undefined, // se non impostato, viene applicato filter: brightness(90%)
        },
        position: "left",
        isHideIcon: false,
      },
      // secondaryButton non impostato — verrà usato lo stile primaryButton con trasparenza (opacity:0.5)
    },
  },
};
```

#### Esempio Configurazione Stili Completa

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Impostazioni profilo
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

#### Esempio Configurazione Completa con Pulsante Login

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Pulsante login con icona
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

#### Esempio Configurazione Completa con Stili Globali e Menu

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Stili globali
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

## Styling Individuale dei Pulsanti Menu { #individual-menu-button-styling }

Per ogni pulsante in `menuButtons`, puoi impostare stili individuali tramite la proprietà `customStyles` di tipo `IComponentStyles`.

### Esempio con Stili Pulsante Individuali

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  menuButtons: [
    {
      text: "Account Personale",
      link: "https://my-account.com",
      icon: "https://icons.com/profile.png",
      customStyles: {
        color: {
          text: "#ffffff",
          background: "#4CAF50", // Sfondo verde
          hover: "#45a049", // Verde scuro al passaggio
        },
        borderRadius: "8px",
        padding: "8px 16px",
        position: "center",
      },
    },
    {
      text: "Impostazioni",
      link: "https://settings.com",
      icon: "https://icons.com/settings.png",
      customStyles: {
        color: {
          text: "#333333",
          background: "#f5f5f5", // Sfondo grigio chiaro
          hover: "#e0e0e0", // Grigio al passaggio
        },
        borderRadius: "6px",
        padding: "6px 12px",
        position: "left",
      },
    },
    {
      text: "Supporto",
      link: "https://support.com",
      customStyles: {
        color: {
          text: "#ffffff",
          background: "#FF5722", // Sfondo arancione
          hover: "#E64A19", // Arancione scuro al passaggio
        },
        borderRadius: "4px",
        padding: "10px 20px",
        position: "center",
        isHideIcon: true, // Nascondi icona per questo pulsante
      },
    },
  ],
};
```

### Priorità di Applicazione degli Stili

1. **Stili individuali del pulsante** (`customStyles` nell'oggetto pulsante) — priorità massima
2. **Stili accountButton** (`customStyles.components.accountButton`) — se gli stili individuali non sono impostati
3. **Stili predefiniti** — se i precedenti non sono impostati

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Se un pulsante NON ha customStyles, gli stili accountButton vengono applicati a menuButtons
  customStyles: {
    components: {
      // stili accountButton predefiniti
      accountButton: {
        color: {
          text: "#666666",
          background: "#efefef",
          hover: undefined, // se non impostato, viene applicato filter: brightness(90%)
        },
        position: "left",
      },
    },
  },
};
```

### Principi di Styling del Mini-widget

| Principio                             | Cosa significa                                                                                   | Come applicarlo                                                                                                                                                                                                                             |
| :------------------------------------ | :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gestione Centralizzata**            | Tutte le impostazioni dell'aspetto sono definite tramite tre oggetti di configurazione chiave.   | Configura l'aspetto generale in `customStyles`, il profilo in `profile` e il pulsante di login in `loginButton`.                                                                                                                            |
| **Configurazione Profilo Flessibile** | L'aspetto del blocco con il nome e l'avatar dell'utente autorizzato è configurato separatamente. | Usa `profile.wrapper` per lo sfondo e `profile.button` per il pulsante dell'avatar. Nota che qui funzionano solo le impostazioni del colore.                                                                                                |
| **Configurazione Pulsante Login**     | Gli stili per il pulsante visto dagli utenti non autorizzati sono configurati indipendentemente. | Definisci testo, icona e stili nell'oggetto `loginButton` e nella sua proprietà `customStyles`.                                                                                                                                             |
| **Struttura Colore**                  | Lo schema dei colori per qualsiasi elemento è descritto in modo uniforme.                        | Usa sempre un oggetto `color` annidato con i campi `text`, `background` e `hover` (es. `color: {text: "#fff", background: "#1976d2"}`).                                                                                                     |
| **Gestione Visualizzazione**          | Etichette di testo o icone possono essere facilmente nascoste.                                   | Usa i flag `isHideText` (nascondi testo) e `isHideIcon` (nascondi icona) negli stili dei componenti.                                                                                                                                        |
| **Allineamento Flessibile**           | Il contenuto all'interno dei pulsanti può essere allineato a sinistra o al centro.               | Imposta la proprietà `position: "left"` o `position: "center"` negli stili del pulsante desiderato.                                                                                                                                         |
| **Ereditarietà Intelligente**         | Il sistema colma le lacune di configurazione utilizzando valori predefiniti logici.              | - Per `secondaryButton`: se gli stili non sono impostati, eredita `primaryButton` con trasparenza aggiunta.<br>- Per `hover`: se il colore non è specificato, viene applicato `filter: brightness(90%)` allo sfondo al passaggio del mouse. |
| **Sistema di Fallback**               | I pulsanti nel menu a tendina usano stili generali se quelli individuali non sono impostati.     | Se un pulsante in `menuButtons` manca dei propri `customStyles`, vengono applicati automaticamente gli stili di `accountButton`.                                                                                                            |
| **Raggio Bordo Globale**              | Un singolo valore di raggio angoli può essere impostato per tutti gli elementi del widget.       | Specifica `customStyles.global.borderRadius` (es. `"8px"`), e influenzerà pulsanti e finestre modali.                                                                                                                                       |
| **Personalizzazione Individuale**     | Qualsiasi pulsante nel menu può essere stilizzato in modo completamente unico.                   | Aggiungi un oggetto `customStyles` per uno specifico elemento nell'array `menuButtons`.                                                                                                                                                     |

---

## Vedi Anche { #see-also }

- [Gestione Applicazioni](./docs-10-common-app-settings.md) — guida per la creazione, configurazione e gestione di applicazioni OAuth 2.0 e OpenID Connect (OIDC).
- [Gestione Organizzazioni](./docs-11-common-org-settings.md) — guida per lavorare con le organizzazioni in **Encvoy ID**.
- [Profilo Personale e Gestione Permessi App](./docs-12-common-personal-profile.md) — guida per la gestione del tuo profilo personale.
