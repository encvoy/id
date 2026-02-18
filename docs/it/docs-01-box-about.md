---
title: "Sistema SSO Encvoy ID per l'Autenticazione Aziendale"
description: "Encvoy ID è un sistema SSO aziendale per il single sign-on con OAuth 2.0, OpenID Connect e 2FA. Scopri come implementare l'autenticazione centralizzata."
keywords:
  - sistema SSO
  - sistema SSO aziendale
  - Single Sign-On
  - single sign-on
  - Identity Provider (IdP)
  - OAuth 2.0
  - OpenID Connect (OIDC)
  - provider OAuth 2.0
  - provider OpenID Connect
  - autenticazione centralizzata
  - autenticazione aziendale
  - autenticazione a due fattori (2FA)
  - applicazioni aziendali
  - autorizzazione OIDC
  - autorizzazione OAuth
  - integrazione SSO
  - provider affidabili
author: "Team Encvoy ID"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Panoramica del Sistema"
order: 1
---

# Panoramica di Encvoy ID — Sistema Single Sign-On (SSO)

**Encvoy ID** è un sistema Single Sign-On (SSO) per l'autenticazione centralizzata degli utenti e la gestione degli accessi alle applicazioni aziendali.

Il sistema fornisce un'autenticazione centralizzata sicura con supporto per SSO, OAuth 2.0, OpenID Connect e autenticazione a due fattori.

---

## Casi d'Uso per Encvoy ID

**Encvoy ID** è un sistema progettato per organizzare l'accesso centralizzato degli utenti alle risorse informative aziendali utilizzando un unico account.

**Encvoy ID** si rivolge alle aziende che richiedono:

- **Finestra di accesso unico** per servizi interni ed esterni
- **Gestione centralizzata degli accessi** per diverse categorie di utenti (dipendenti, collaboratori, clienti)
- **Sicurezza avanzata** con supporto per l'autenticazione a più fattori
- **Controllo rigoroso e auditing** delle azioni degli utenti
- **Integrazione sicura** di molteplici applicazioni con diversi sistemi di autenticazione

---

## Caratteristiche Principali di Encvoy ID

### 1. Autenticazione e Accesso

Il sistema fornisce un'autenticazione centralizzata e supporta molteplici protocolli e metodi di autenticazione.

#### Protocolli Supportati

- **OpenID Connect (OIDC)** — autenticazione dell'utente e trasmissione dei dati di identità
- **OAuth 2.0** — autorizzazione e gestione dell'accesso alle risorse

#### Metodi di Autenticazione

- **Metodi base**: login e password, email
- **Identity Provider Esterni**: social network, sistemi aziendali affidabili e altri servizi
- **Metodi avanzati e senza password:** autenticazione crittografica tramite **mTLS** (certificati client) e **WebAuthn** (biometria, chiavi hardware), oltre a password monouso **TOTP/HOTP**.

#### Autenticazione a Due Fattori (2FA / MFA)

**Encvoy ID** supporta l'autenticazione a più fattori (MFA), in cui l'accesso viene concesso solo dopo la verifica riuscita dell'identità dell'utente tramite diversi fattori indipendenti (conoscenza, possesso, biometria).

### 2. Gestione di Applicazioni e Utenti

- **Creazione e configurazione di applicazioni:** applicazioni web, applicazioni mobili native
- **Personalizzazione del widget:** branding del widget di autenticazione esterno per adattarlo allo stile dell'azienda
- **Gestione utenti:** registrazione, modifica, blocco, cambio password

### 3. Sicurezza e Audit

- **Differenziazione dei diritti di accesso**
- **Logging dettagliato** di tutti gli eventi e le azioni

### 4. Mini-widget

Un componente JavaScript leggero che fornisce un accesso rapido alle funzioni di autenticazione e alle informazioni dell'utente. È facilmente integrabile in qualsiasi sito web e interfaccia, fornendo transizioni al profilo, alla dashboard dell'organizzazione e alle applicazioni.

### Livelli di Accesso

Il sistema fornisce un modello di accesso flessibile basato sui ruoli:

| Ruolo                          | Permessi                                                                 | Destinato a                                   |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------- |
| **Service Amministratore**     | Accesso completo a tutte le applicazioni, utenti e impostazioni globali  | Amministratori di sistema, superuser          |
| **Gestore**                    | Gestione delle applicazioni e dei metodi di accesso per la propria unità | Responsabili di dipartimento, project manager |
| **Application Amministratore** | Gestione di applicazioni specifiche e dei relativi utenti                | Sviluppatori, amministratori di app           |
| **Partecipante**               | Gestione del proprio profilo e dei permessi di accesso ai dati personali | Utenti regolari, dipendenti                   |

### Moduli del Sistema Encvoy ID

#### 1. Profilo

Il modulo "Profilo" consente la gestione dei dati personali dell'utente e delle impostazioni di accesso. Include funzioni per la modifica delle informazioni personali, impostazioni della privacy, gestione dei permessi delle applicazioni e visualizzazione del registro delle attività. Il modulo fornisce anche l'accesso al catalogo pubblico delle applicazioni.

#### 2. Dashboard Amministratore

Il modulo "Dashboard Amministratore" è progettato per la gestione centralizzata del sistema **Encvoy ID**. Include funzioni per la configurazione dei parametri globali del sistema, dei metodi di autenticazione e dell'aspetto della pagina di login. In questo modulo è possibile gestire le applicazioni e gli account utente, nonché monitorare la loro attività attraverso un registro eventi unificato.

#### 3. Dashboard Organizzazione

Il modulo "Dashboard Organizzazione" consente la gestione delle applicazioni, dei metodi di autenticazione e delle policy di accesso all'interno di un'organizzazione. Include le impostazioni dei parametri dell'organizzazione, la configurazione dei metodi di login, la gestione delle applicazioni dell'organizzazione e il monitoraggio dell'attività degli utenti.

#### 4. Dashboard Applicazione (ADM)

Il modulo "Dashboard Applicazione" è destinato all'amministrazione di singole applicazioni. Contiene funzioni per la gestione delle applicazioni assegnate e il monitoraggio dell'attività degli utenti che hanno accesso a tali applicazioni.

---

## Concetto e Principi Operativi di Encvoy ID

### Schema Generale di Interazione

<img src="./images/interaction-scheme.drawio.png" alt="Schema generale di interazione di Encvoy ID con i sistemi aziendali" style="max-width:700px; width:100%">

**Sequenza di Interazione:**

1. **Richiesta di Accesso** — l'utente accede al sistema informativo (IS).
2. **Controllo nel DB dell'IS** — il sistema verifica l'esistenza dell'utente.
3. **Reindirizzamento al Widget** — l'utente viene indirizzato a **Encvoy ID**.
4. **Autenticazione** — l'utente esegue la procedura di login.
5. **Controllo nel DB di Encvoy ID** — validazione delle credenziali.
6. **Fornitura del Profilo** — restituzione dei dati utente.
7. **Mappatura nell'IS** — ricerca dell'utente in base ai dati di **Encvoy ID**.
8. **Controllo dei Diritti** — autorizzazione nel sistema di destinazione.
9. **Accesso Concesso** — login riuscito nel sistema.

> 📌 **Requisiti di Integrazione:** Per collegare un sistema informativo a **Encvoy ID**, sono necessari un database utenti e un modulo di autorizzazione che supporti OpenID Connect o OAuth 2.0.

### Schema di Autorizzazione OpenID Connect

<img src="./images/oidc-authorization-scheme.drawio.png" alt="Schema di autorizzazione OpenID Connect" style="max-width:700px; width:100%">

**Fasi Chiave OIDC:**

1. L'utente accede all'IS.
2. L'IS (client) genera `code_verifier` e `code_challenge`.
3. L'IS reindirizza l'utente a `/authorize` in **Encvoy ID**.
4. L'utente viene reindirizzato al widget di autorizzazione di **Encvoy ID**.
5. L'utente inserisce login/password e fornisce il consenso al trasferimento dei dati.
6. La verifica dell'utente viene eseguita nel DB di **Encvoy ID**.
7. L'utente viene reindirizzato all'IS (client) con un `Authorization code`.
8. L'IS invia una richiesta a `/token` in **Encvoy ID**.
9. Verifica di `code_challenge` e `code_verifier` in **Encvoy ID**.
10. Fornitura dell' `id token` contenente il profilo utente di **Encvoy ID** e dell' `access token` (opzionalmente `refresh token`) all'IS.
11. Autenticazione dell'utente nell'IS.
12. L'utente ottiene l'accesso all'IS.

### Schema di Autorizzazione OAuth 2.0

<img src="./images/oauth-authorization-scheme.drawio.png" alt="Schema di autorizzazione OAuth 2.0" style="max-width:700px; width:100%">

**Caratteristiche del Flusso OAuth 2.0:**

1. L'utente accede all'IS.
2. L'IS reindirizza l'utente a `/authorize` in **Encvoy ID**.
3. L'utente viene reindirizzato al widget di autorizzazione di **Encvoy ID**.
4. L'utente inserisce login/password e fornisce il consenso al trasferimento dei dati.
5. La verifica dell'utente viene eseguita nel DB di **Encvoy ID**.
6. **Encvoy ID** reindirizza l'utente all'IS con un `Authorization code` all' `Redirect_URI`.
7. L'IS invia una richiesta per un `token` utilizzando l' `Authorization code`.
8. **Encvoy ID** convalida la richiesta.
9. **Encvoy ID** restituisce `id token` e `access token` (opzionalmente `refresh token`).
10. L'IS richiede il profilo utente.
11. **Encvoy ID** fornisce il profilo utente.
12. L'IS convalida le risposte e stabilisce una sessione utente locale.
13. L'utente ottiene l'accesso all'IS.

### Schema Single Sign-On (SSO)

<img src="./images/sso-scheme.drawio.png" alt="Come funziona il Single Sign-On tra più sistemi" style="max-width:400px; width:100%">

**Scenario Tipico:**

1. Richiesta di accesso a IS1.
2. Autenticazione dell'utente in **Encvoy ID**.
3. Fornitura del profilo utente di **Encvoy ID** a IS1.
4. Richiesta di accesso a IS2.
5. Fornitura del profilo utente di **Encvoy ID** a IS2 senza ripetere la procedura di autenticazione.

> 🚀 **Pronto per iniziare?** Procedi alla [guida all'installazione del sistema](./docs-02-box-system-install.md).

---

## Vedere Anche

- [Installazione del Sistema Encvoy ID](./docs-02-box-system-install.md) — una guida all'installazione del sistema.
- [Variabili d'Ambiente Encvoy ID](./docs-03-box-system-configuration.md) — una guida alla preparazione della configurazione prima del lancio.
- [Configurazione del Sistema](./docs-04-box-system-settings.md) — una guida alla configurazione dell'interfaccia e dell'accesso degli utenti al sistema.
