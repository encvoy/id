---
title: "Login via Email in Encvoy ID — Configurazione Email"
description: "Scopri come abilitare il login via email in Encvoy ID: crea un metodo di login e aggiungilo al widget di autorizzazione. Connettiti in pochi passaggi."
keywords:
  - login email in Encvoy ID
  - configurazione email
  - autenticazione email
  - connettere email
  - Email login Encvoy ID
  - Email OAuth Encvoy ID
author: Team Encvoy ID
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via Email"
---

# Come connettere il Login via Email in Encvoy ID

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di login. Per maggiori dettagli, leggi la guida [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come abilitare l'autenticazione via email nella tua organizzazione o applicazione. Il metodo di login via Email verrà utilizzato per inviare notifiche email, come email di registrazione, recupero password e altri eventi.

La configurazione del login tramite **Email** consiste in diversi passaggi:

- [Passaggio 1. Creazione di un metodo di login](#step-1-create-login-method)
- [Passaggio 2. Aggiunta al widget](#step-2-add-to-widget)

---

## Passaggio 1. Creazione di un metodo di login { #step-1-create-login-method }

1. Vai al Pannello di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di login per un'organizzazione, apri la **Dashboard dell'Organizzazione**. Se il metodo di login è necessario per un'applicazione specifica, apri **le impostazioni di quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Create Button](./images/button-create.webp "Create Button").
4. Si aprirà una finestra con un elenco di template.
5. Seleziona il template **Email**.
6. Compila il modulo di creazione:

   **Informazioni di Base**
   - **Nome** — Il nome che gli utenti visualizzeranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella standard.

   **Parametri**
   - **Indirizzo email principale** — L'indirizzo email principale che verrà utilizzato per l'invio delle email.
   - **Indirizzo del server di posta in uscita** — L'indirizzo del server di posta in uscita.
   - **Porta del server di posta in uscita** — La porta del server di posta in uscita.
   - **Password email** — Una password normale o una password per l'app creata nelle impostazioni dell'account del servizio email.
   - **Tempo di vita del codice di conferma** — La durata del codice di conferma per il servizio email in secondi.

   **Impostazioni Aggiuntive**
   - **Metodo di accesso pubblico** — Abilita questa opzione se desideri che questo metodo di login sia disponibile per l'aggiunta ad altre applicazioni del sistema (o dell'organizzazione), nonché al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).

7. Clicca su **Crea**.

Dopo la creazione riuscita, il nuovo metodo di login apparirà nell'elenco generale dei provider.

---

## Passaggio 2. Aggiunta al widget { #step-2-add-to-widget }

Per rendere visibile agli utenti il pulsante **Login via Email** nel modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Trova il metodo di login creato nell'elenco generale dei provider.
2. Attiva l'interruttore sul pannello del provider.

> **Verifica**: Dopo il salvataggio, apri il modulo di login in un'applicazione di test. Un nuovo pulsante con il logo **Email** dovrebbe apparire sul widget.

---

## Vedi Anche

- [Metodi di Login e Configurazione del Widget di Login](./docs-06-github-en-providers-settings.md) — una guida ai metodi di login e alla configurazione del widget di login.
- [Gestione dell'Organizzazione](./docs-09-common-mini-widget-settings.md) — una guida al lavoro con le organizzazioni nel sistema **Encvoy ID**.
- [Profilo Personale e Gestione dei Permessi delle App](./docs-12-common-personal-profile.md) — una guida alla gestione del profilo personale.
