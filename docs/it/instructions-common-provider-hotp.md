---
title: "Accesso tramite HOTP — Connessione e Configurazione in {{projectName}}"
description: "Scopri come abilitare l'accesso HOTP in {{projectName}}: crea un metodo di login, aggiungilo al widget di autorizzazione e garantisci un accesso sicuro per gli utenti."
keywords:
  - accesso tramite HOTP
  - autenticazione HOTP
  - configurazione HOTP
  - connessione HOTP
  - login HOTP
  - autenticazione a due fattori HOTP
  - HOTP {{projectName}}
  - accesso via HOTP {{projectName}}
  - impostazione HOTP in {{projectName}}
  - HOTP
  - HMAC-based One-Time Password
  - password monouso
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Accesso tramite HOTP"
---

# Come Connettere l'Accesso tramite HOTP in {{projectName}}

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di accesso. Per maggiori dettagli, leggi la guida [Metodi di Accesso e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come connettere l'autenticazione con password monouso **HOTP** al sistema **{{projectName}}**.

A chi è rivolta questa guida:

- Amministratori — per configurare il metodo di accesso nel sistema.
- Utenti — per collegare **HOTP** al proprio profilo.

La configurazione dell'accesso tramite **HOTP** si compone di diverse fasi chiave:

- [Configurazione dell'Autenticazione per gli Amministratori](#admin-authentication-setup)
- [Collegamento HOTP per gli Utenti](#hotp-user-binding)

---

## Informazioni Generali

**HOTP** (HMAC-based One-Time Password) è un algoritmo per la generazione di password monouso basato su una chiave segreta e un contatore che aumenta ad ogni utilizzo riuscito del codice. È ampiamente utilizzato per l'autenticazione a due fattori, aggiungendo un livello di sicurezza superiore allo standard nome utente e password.

La differenza principale tra **HOTP** e **TOTP** è che i codici non dipendono dal tempo. Ogni utilizzo di un codice incrementa il contatore e il server verifica il codice inserito rispetto al valore attuale del contatore.

> 💡 Per creare un metodo di accesso basato su **TOTP**, utilizza la guida [Come Connettere l'Accesso tramite TOTP](./instructions-common-provider-totp.md).

**Componenti Principali:**

- **Server di Autenticazione** — il server che genera la chiave segreta e verifica i codici inseriti, tenendo conto del contatore.
- **Authenticatore** — un'applicazione che memorizza la chiave segreta e il contatore corrente, generando password monouso.
- **Chiave Segreta** — una base condivisa tra il server e l'applicazione utilizzata per generare i codici.

### Come Funziona HOTP

1. **Configurazione Preliminare**
   - L'amministratore crea un metodo di accesso **HOTP** e lo attiva per i widget delle applicazioni richieste.
   - L'utente aggiunge un nuovo identificatore **HOTP** nel proprio profilo scansionando un codice QR con la chiave segreta utilizzando un'app di autenticazione.

2. **Generazione e Verifica del Codice**
   - L'app di autenticazione calcola una password monouso basata sulla chiave segreta e sul valore corrente del contatore utilizzando l'algoritmo `SHA1`, `SHA256` o `SHA512`.
   - Quando l'utente inserisce il codice nel modulo di accesso, il server calcola il codice atteso utilizzando lo stesso segreto e il contatore corrente.
   - Se il codice corrisponde, il server incrementa il contatore e concede l'accesso all'utente.

> 🚨 **Importante**: **HOTP** non dipende dal tempo, quindi non è richiesta la sincronizzazione dell'orologio.

---

## Configurazione dell'Autenticazione per gli Amministratori { #admin-authentication-setup }

### Passaggio 1. Creazione di un Metodo di Accesso

1. Vai al Pannello di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di accesso per un'organizzazione, apri la **Dashboard dell'Organizzazione**. Se il metodo di accesso è necessario per un'applicazione specifica, apri le **impostazioni di quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Pulsante Crea](./images/button-create.webp "Pulsante Crea").
4. Si aprirà una finestra con un elenco di modelli.
5. Seleziona il modello **HOTP**.
6. Compila il modulo di creazione:

   **Informazioni di Base**
   - **Nome** — Il nome che gli utenti vedranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella predefinita.

   **Parametri**
   - **Numero di cifre** — Il numero di cifre nella password monouso (solitamente 6).
   - **Valore iniziale del contatore** — Contatore corrente (non modificabile).
   - **Algoritmo** — Algoritmo di hashing (`SHA1`, `SHA256` o `SHA512`) (solitamente `SHA-1`).

   **Impostazioni Avanzate**
   - **Metodo di accesso pubblico** — Abilita questa opzione se desideri che questo metodo di accesso sia disponibile per l'aggiunta ad altre applicazioni del sistema (o dell'organizzazione), nonché al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Pubblicità** — Imposta il livello di pubblicità predefinito per l'identificatore del servizio esterno nel profilo utente.

7. Clicca su **Crea**.

Dopo la creazione riuscita, il nuovo metodo di accesso apparirà nell'elenco generale dei provider.

### Passaggio 2. Aggiunta del Provider HOTP al Widget

Per rendere visibile agli utenti il pulsante **HOTP** sul modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Trova il metodo di accesso creato nell'elenco generale dei provider.
2. Attiva l'interruttore sul pannello del provider.

> **Verifica**: Dopo il salvataggio, apri il modulo di accesso in un'applicazione di test. Un nuovo pulsante con il logo **HOTP** dovrebbe apparire sul widget.

---

## Collegamento HOTP per gli Utenti { #hotp-user-binding }

> 📌 Questa istruzione è destinata agli utenti che devono accedere al sistema tramite **HOTP**.

### Passaggio 1. Installazione di un'App di Autenticazione

È necessario installare un'applicazione sul proprio dispositivo mobile che generi codici HOTP.

Le opzioni più popolari sono:

- **Google Authenticator** (Google)

### Passaggio 2. Aggiunta di un Identificatore HOTP al Profilo

1. Vai al tuo **Profilo**.
2. Clicca su **Aggiungi** nel blocco **Identificatori**.

<img src="./images/personal-profile-12.webp" alt="Blocco identificatore nel profilo utente {{projectName}}" style="max-width:600px; width:100%">

3. Nella finestra che si apre, seleziona il metodo di accesso **HOTP**.

4. Scansiona il codice QR utilizzando l'app di autenticazione.
5. Inserisci il codice dall'app e conferma.

> 💡 **Suggerimento**: Se l'identificatore è già collegato a un altro utente, è necessario rimuoverlo dal profilo di quell'utente prima di collegarlo al nuovo account.

### Passaggio 3. Verifica

1. Vai alla pagina di accesso dove è abilitato il metodo di accesso **HOTP**.
2. Seleziona l'icona del metodo di accesso **HOTP**.
3. Si aprirà un modulo per l'inserimento del codice. Senza chiudere la pagina, apri l'app di autenticazione sul tuo telefono.
4. Trova il servizio corrispondente a **{{projectName}}** (o al nome dell'applicazione) e inserisci il tuo login e il codice a 6 cifre nel campo del modulo di accesso.
5. Clicca sul pulsante **Conferma**.

---

## Vedi Anche

- [Metodi di Accesso e Configurazione del Widget di Accesso](./docs-06-github-en-providers-settings.md) — una guida ai metodi di accesso e alla configurazione del widget di login.
- [Gestione dell'Organizzazione](./docs-09-common-mini-widget-settings.md) — una guida al lavoro con le organizzazioni nel sistema **{{projectName}}**.
- [Profilo Personale e Gestione dei Permessi delle Applicazioni](./docs-12-common-personal-profile.md) — una guida alla gestione del tuo profilo personale.
