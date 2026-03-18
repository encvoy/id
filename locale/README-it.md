# Encvoy ID

**[English](../README.md)** | **[Español](README-es.md)** | **Italiano** | **[Français](README-fr.md)** | **[Deutsch](README-de.md)**

---

**Gestione delle identità e degli accessi (IAM) gratuita e open-source per organizzazioni moderne.**

[![docs](https://img.shields.io/badge/docs-current-green)](https://id.encvoy.es/docs)
[![website](https://img.shields.io/badge/website-encvoy.es-green)](https://encvoy.es)
[![email](https://img.shields.io/badge/email-contact-blue)](mailto:contact@encvoy.es)
[![Follow](https://img.shields.io/twitter/follow/encvoylab?style=social)](https://x.com/EncvoyLab)

Piattaforma open-source di Identity and Access Management (IAM) che fornisce autenticazione sicura, autorizzazione e Single Sign-On (SSO) per applicazioni moderne.

Encvoy ID consente alle organizzazioni di gestire le identità, autenticare gli utenti e controllare l'accesso ai servizi utilizzando standard di sicurezza moderni come OpenID Connect (OIDC) e OAuth 2.0.

<img width="1904" height="640" alt="ENCVOYID" src="../ENCVOYID.png" />

È progettato per operare come provider centrale di identità per applicazioni, API, strumenti interni e piattaforme SaaS.

---
## Contenuti

- [Perché Encvoy ID](#perché-encvoy-id)
- [Capacità Principali](#-capacità-principali)
- [Standard Supportati](#-standard-supportati)
- [Architettura](#-architettura)
- [Audit e Monitoraggio](#-audit-e-monitoraggio)
- [Stato del Progetto](#-stato-del-progetto)
- [Casi d'Uso](#-casi-duso)
- [Sicurezza](#-sicurezza)
- [Distribuzione](#-distribuzione)
- [Open Source](#-open-source)
- [Avvio Rapido](#-avvio-rapido)
- [Documentazione](#-documentazione)

## Perché Encvoy ID

I sistemi moderni richiedono una gestione delle identità sicura e flessibile.

Encvoy ID offre:
- Gestione centralizzata delle identità
- Autenticazione sicura
- Single Sign-On tra applicazioni
- Integrazione flessibile con sistemi moderni
- Supporto per l'autenticazione passwordless

La piattaforma può essere utilizzata come alternativa self-hosted alle soluzioni IAM commerciali.

---

## ✨ Capacità Principali

### Gestione delle Identità

- Directory utenti centralizzata
- Gestione del ciclo di vita delle identità
- Gruppi e ruoli utente
- Controllo degli accessi basato sui ruoli (RBAC)

### Autenticazione

Encvoy ID supporta una vasta gamma di metodi di autenticazione, incluse opzioni passwordless e resistenti al phishing.

#### Metodi standard

- Nome utente e password
- Accesso tramite email

#### Metodi forti e passwordless

- WebAuthn / Passkeys
- mTLS (certificati client)
- Password monouso TOTP / HOTP

### Provider di identità esterni

Encvoy ID può integrarsi con provider di identità esterni come:

- Google
- GitHub
- Altri provider OpenID Connect

Più fattori di autenticazione possono essere combinati per implementare l'**autenticazione a più fattori (MFA)**.

---

## 📜 Standard Supportati

- OpenID Connect (OIDC)
- OAuth 2.0
- WebAuthn
- TOTP / HOTP
- TLS reciproco (mTLS)

---

## 🏗 Architettura

Encvoy ID è costruito come piattaforma modulare composta da diversi servizi.

| Componente | Descrizione |
|---|---|
| Backend | Servizio IAM principale |
| OIDC | Provider OpenID Connect |
| Dashboard | Interfaccia di amministrazione |
| Auth | Servizio di autenticazione |
| Widget-auth | Widget di autenticazione per applicazioni |

Questa architettura consente alla piattaforma di scalare e integrarsi con ambienti differenti.

---

## 📊 Audit e Monitoraggio

Encvoy ID fornisce una registrazione dettagliata degli eventi di autenticazione e delle attività degli utenti.

Le funzionalità includono:

- Log degli eventi di autenticazione
- Tracciamento delle attività degli utenti
- Monitoraggio della sicurezza
- Registri pronti per audit e conformità

---

## 🚧 Stato del Progetto

Encvoy ID è un progetto open-source in sviluppo attivo.

Nuove funzionalità e miglioramenti vengono aggiunti continuamente.
Feedback e contributi della community sono benvenuti.

## 💼 Casi d'Uso

Encvoy ID può essere utilizzato per:

- Piattaforma centrale di identità per organizzazioni
- SSO per servizi interni
- Autenticazione per piattaforme SaaS
- Provider di identità per API
- Autenticazione di microservizi
- Accesso centralizzato per più applicazioni

---

## 🔐 Sicurezza

Encvoy ID è progettato secondo principi security-first.

Le funzionalità di sicurezza includono:

- Autenticazione resistente al phishing
- Accesso passwordless
- Autenticazione sicura basata su token
- Applicazione centralizzata delle policy
- Audit logging dettagliato

---

## 🌍 Distribuzione

Encvoy ID può essere distribuito in ambienti diversi:

- Infrastruttura on-premise
- Cloud privato o pubblico
- Ambienti ibridi

---

## 🌱 Open Source

Encvoy ID è gratuito e open-source.

Le organizzazioni possono usarlo, modificarlo e distribuirlo liberamente.
I contributi della community sono benvenuti.

---

## 🚀 Avvio Rapido

- [Avvio rapido](README-qs-it.md)

## 📚 Documentazione

- [Documentazione](../docs/it/SUMMARY-github-it.md)

---

© Encvoy Lab
