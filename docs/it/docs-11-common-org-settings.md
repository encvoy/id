---
title: "Organizzazione {{projectName}} — Gestione e Configurazione degli Accessi"
description: "Scopri come configurare un'organizzazione in {{projectName}}: creazione, branding, gestione degli accessi, metodi di login e auditing delle attività degli utenti."
keywords:
  - {{projectName}} organization
  - {{projectName}} organization dashboard
  - organization settings
  - organization login methods
  - organization access management
  - organization branding
author: "Team {{projectName}}"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Gestione della tua Organizzazione"
order: 6
---

# Gestione di un'Organizzazione in {{projectName}}

In **{{projectName}}**, le organizzazioni fungono da unità strutturale primaria per la gestione dell'accesso alle applicazioni, la suddivisione dei dipendenti per dipartimenti e il mantenimento degli audit sulle attività degli utenti. In questa guida vedremo come creare organizzazioni e configurare i metodi di login.

**Sommario:**

- [Basi dell'Organizzazione](#organization-basics)
- [Accesso alla Dashboard dell'Organizzazione](#organization-panel-access)
- [Configurazione del Nome e del Logo dell'Organizzazione](#organization-name-and-logo)
- [Metodi di Login dell'Organizzazione](#organization-login-methods)
- [Vedi Anche](#see-also)

---

## Basi dell'Organizzazione { #organization-basics }

Un'organizzazione in **{{projectName}}** è un'unità strutturale che consente di:

- **Segregare l'accesso** alle applicazioni tra dipartimenti o progetti,
- **Configurare metodi di login aziendali**,
- **Mantenere un auditing centralizzato** dell'attività degli utenti,
- **Gestire le applicazioni** all'interno di una singola azienda,
- **Configurare il branding** (logo, nome) per i widget di login.

> 💡 **Caso d'uso:** Le organizzazioni sono ideali per le aziende che devono gestire molteplici applicazioni e gruppi di utenti da un unico punto di controllo.

---

## Accesso alla Dashboard dell'Organizzazione { #organization-panel-access }

La dashboard dell'organizzazione è progettata per gestire le impostazioni dell'organizzazione, le applicazioni e gli utenti.

Nella dashboard dell'organizzazione sono disponibili le seguenti sezioni:

- **Impostazioni** — parametri dell'organizzazione, metodi di login e personalizzazione del widget di login.
- **Applicazioni** — gestione delle applicazioni dell'organizzazione.
- **Log** — cronologia delle attività degli utenti dell'organizzazione.

### Come accedere alla dashboard dell'organizzazione {{projectName}}

> ⚠️ Per accedere alla dashboard dell'organizzazione, è necessario disporre dei permessi di **Gestore**. Contatta l'amministratore del servizio per ottenerli.

Per aprire la dashboard dell'organizzazione:

1. Accedi al tuo account personale **{{projectName}}**.
2. Clicca sul tuo nome nell'angolo in alto a destra della finestra.
3. Nella finestra del mini-widget che si apre, clicca sul nome della tua organizzazione.

    <img src="./images/org-settings-01.webp" alt="Selezione di un'organizzazione nel mini-widget {{projectName}}" style="max-width:300px; width:100%">

Verrai reindirizzato alla **Dashboard dell'Organizzazione**.

> 💡 Aggiungi le applicazioni utilizzate di frequente al mini-widget utilizzando l'impostazione **Mostra nel mini-widget** per un accesso rapido. <br>
> <img src="./images/org-settings-02.webp" alt="Configurazione della visualizzazione dell'applicazione nel mini-widget {{projectName}}" style="max-width:300px; width:100%">

## Configurazione del Nome e del Logo dell'Organizzazione { #organization-name-and-logo }

Il nome e il logo vengono visualizzati nell'interfaccia di sistema di **{{projectName}}** e nel mini-widget.

Per configurare il nome e il logo:

1. Vai alla dashboard dell'organizzazione → scheda **Impostazioni**.
2. Espandi il blocco **Informazioni principali**.
3. Specifica il nuovo nome nel campo **Nome dell'applicazione**.
4. Nella sezione **Logo dell'applicazione**, clicca su **Carica** e seleziona il file del logo.

    > ⚡ Formati supportati: JPG, GIF, PNG, WEBP; dimensione massima 1 MB.

5. Regola l'area di visualizzazione del logo.

    <img src="./images/settings-main-info-02.webp" alt="Configurazione delle informazioni di base dell'organizzazione in {{projectName}}" style="max-width:400px; width:100%">

6. Clicca su **Salva**.

---

## Metodi di Login dell'Organizzazione { #organization-login-methods }

Un **metodo di login** è una modalità di autenticazione dell'utente che gli consente di accedere alle applicazioni.

Un'organizzazione può utilizzare sia metodi di login pubblici che metodi di login creati specificamente per quell'organizzazione.

**È possibile:**

- Utilizzare **metodi di login pubblici** configurati dall'amministratore di **{{projectName}}**
- Aggiungere i **propri metodi di login** esclusivamente per la propria organizzazione
- Configurare la **pubblicità** — determinare dove saranno disponibili i propri metodi di login
- Rendere gli identificatori **obbligatori** per gli utenti

> ⚠️ **Restrizioni:** Solo gli amministratori di **{{projectName}}** possono modificare i metodi di login pubblici.

> 🔍 Istruzioni dettagliate per la creazione, modifica ed eliminazione dei metodi di login sono fornite nella guida principale: [Configurazione dei Metodi di Login](./docs-06-github-en-providers-settings.md#managing-login-methods).  

---

## Vedi Anche { #see-also }

- [Metodi di Login e Configurazione del Widget di Login](./docs-06-github-en-providers-settings.md) — una guida ai metodi di login e alla configurazione del widget di login.
- [Gestione delle Applicazioni](./docs-10-common-app-settings.md) — una guida alla creazione, configurazione e gestione delle applicazioni OAuth 2.0 e OpenID Connect (OIDC).
- [Profilo Personale e Gestione dei Permessi delle Applicazioni](./docs-12-common-personal-profile.md) — una guida alla gestione del proprio profilo personale.