# Come Connettere il Login TOTP in Encvoy ID

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di login. Per maggiori dettagli, leggi la guida [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come connettere l'autenticazione con password monouso **TOTP** al sistema **Encvoy ID**.

A chi è rivolta questa istruzione:

- **Amministratori** — per configurare il metodo di login nel sistema.
- **Utenti** — per collegare il **TOTP** al proprio profilo.

La configurazione del login **TOTP** si compone di diverse fasi chiave:

- [Configurazione dell'Autenticazione per gli Amministratori](#admin-authentication-setup)
- [Collegamento TOTP per gli Utenti](#totp-user-binding)

---

## Informazioni Generali

**TOTP** (Time-based One-Time Password) è un algoritmo per la generazione di password monouso valide per un breve periodo di tempo.

> 💡 Per creare un metodo di login basato su **HOTP**, utilizza l'istruzione [Come Connettere il Login HOTP](./instructions-common-provider-hotp.md).

La differenza principale tra **TOTP** e **HOTP** è che la generazione della password si basa sull'ora corrente. Di solito, non utilizza un timestamp esatto ma piuttosto l'intervallo corrente con confini predefiniti (tipicamente 30 secondi).

**Componenti Principali:**

- **Server di Autenticazione** — il server che genera la chiave segreta e verifica i codici inseriti.
- **Authenticatore** — un'applicazione che memorizza la chiave segreta e genera l'OTP corrente.
- **Chiave Segreta** — una base condivisa tra il server e l'applicazione utilizzata per la generazione del codice.

### Flusso di Lavoro TOTP

1. **Configurazione Preliminare**
   - L'amministratore crea un metodo di login **TOTP** e lo attiva per i widget delle applicazioni richieste.
   - L'utente aggiunge un nuovo identificatore **TOTP** nel proprio profilo scansionando un codice QR contenente la chiave segreta tramite un'app di autenticazione.

2. **Generazione e Verifica del Codice**
   - L'app di autenticazione calcola una password monouso basata sulla chiave segreta e sull'intervallo di tempo corrente (solitamente 30 secondi) utilizzando l'algoritmo `SHA1`, `SHA256` o `SHA512`.
   - Quando l'utente inserisce il codice nel modulo di login, il server ricalcola il codice atteso utilizzando lo stesso segreto e l'ora corrente.
   - Se il codice inserito corrisponde a quello atteso, all'utente viene concesso l'accesso.

> 🚨 **Importante**: L'ora sul dispositivo dell'utente e sul server deve essere sincronizzata. Il disallineamento temporale è la causa più comune di rifiuto del codice. Per compensare piccole differenze temporali, il server può accettare codici da intervalli di tempo adiacenti (solitamente ±1 intervallo).

---

<a name="admin-authentication-setup"></a>

## Configurazione dell'Autenticazione per gli Amministratori

### Passaggio 1. Creazione di un Metodo di Login

1. Vai al Pannello di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di login per un'organizzazione, apri la **Dashboard dell'Organizzazione**. Se il metodo di login è necessario per un'applicazione specifica, apri le **impostazioni di quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Pulsante Crea](./images/button-create.webp "Pulsante Crea").
4. Si aprirà una finestra con un elenco di modelli.
5. Seleziona il modello **TOTP**.
6. Compila il modulo di creazione:

   **Informazioni di Base**
   - **Nome** — Il nome che gli utenti vedranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella predefinita.

   **Parametri**
   - **Numero di cifre** — Numero di cifre nella password monouso (solitamente 6).
   - **Periodo di validità** — Periodo di validità della password monouso in secondi (si consiglia 30).
   - **Algoritmo** — Algoritmo di hashing (`SHA1`, `SHA256` o `SHA512`) (solitamente `SHA-1`).

   **Impostazioni Aggiuntive**
   - **Metodo di accesso pubblico** — Abilita questa opzione se desideri che questo metodo di login sia disponibile per l'aggiunta ad altre applicazioni del sistema (o dell'organizzazione), nonché al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Pubblicità** — Configura il livello di pubblicità predefinito per l'identificatore di servizio esterno nel profilo utente.

7. Clicca su **Crea**.

Dopo la creazione con successo, il nuovo metodo di login apparirà nell'elenco generale dei provider.

### Passaggio 2. Aggiunta del Provider TOTP al Widget

Affinché gli utenti vedano il pulsante **TOTP** nel modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Trova il metodo di login creato nell'elenco generale dei provider.
2. Sposta l'interruttore sul pannello del provider nella posizione "On".

> **Verifica**: Dopo il salvataggio, apri il modulo di login in un'applicazione di test. Un nuovo pulsante con il logo **TOTP** dovrebbe apparire sul widget.

---

<a name="totp-user-binding"></a>

## Collegamento TOTP per gli Utenti

> 📌 Questa istruzione è destinata agli utenti che devono accedere al sistema tramite **TOTP**.

### Passaggio 1. Installazione di un'App di Autenticazione

È necessario installare un'applicazione sul proprio dispositivo mobile che generi codici TOTP.

Le opzioni più popolari sono:

- **Google Authenticator** (Google)

> 💡 Assicurati che l'ora sul tuo dispositivo mobile sia impostata per l'aggiornamento automatico (tramite la rete). L'ora errata è il motivo più comune per cui i codici non vengono accettati.

### Passaggio 2. Aggiunta di un Identificatore TOTP al Profilo

1. Vai al tuo **Profilo**.
2. Clicca su **Aggiungi** nel blocco **Identificatori**.

<img src="./images/personal-profile-12.webp" alt="Blocco identificatore nel profilo utente Encvoy ID" style="max-width:600px; width:100%">

3. Nella finestra che si apre, seleziona il metodo di login **TOTP**.
4. Scansiona il codice QR utilizzando la tua app di autenticazione.

<img src="./images/instructions-provider-totp-02.webp" alt="Finestra di dialogo per l'aggiunta di un identificatore TOTP nel profilo utente Encvoy ID" style="max-width:400px; width:100%">

5. Inserisci il codice dall'app e conferma.

> 💡 **Suggerimento**: Se l'identificatore è già collegato a un altro utente, devi rimuoverlo dal profilo di quell'utente prima di collegarlo al nuovo account.

### Passaggio 3. Verifica

1. Vai alla pagina di login dove è abilitato il metodo di login **TOTP**.
2. Seleziona l'icona del metodo di login **TOTP**.
3. Si aprirà un modulo per l'inserimento del codice.
4. Inserisci il tuo login.

<img src="./images/instructions-provider-totp-03.webp" alt="Esempio di widget di login per identificatore TOTP in Encvoy ID" style="max-width:300px; width:100%">

5. Senza chiudere la pagina, apri l'app di autenticazione sul telefono. Copia il codice a 6 cifre e incollalo nel modulo.

6. Clicca sul pulsante **Conferma**.

> 🔄 **Se il codice non viene accettato**: Assicurati che l'ora sul telefono e sul server sia sincronizzata. Prova ad aspettare la generazione del codice successivo (ne appare uno nuovo ogni 30 secondi). Se il problema persiste, contatta l'amministratore.

---

## Vedi Anche

- [Metodi di Login e Configurazione del Widget di Login](./docs-06-github-en-providers-settings.md) — una guida ai metodi di login e alla configurazione del widget.
- [Gestione dell'Organizzazione](./docs-11-common-org-settings.md) — una guida per lavorare con le organizzazioni nel sistema **Encvoy ID**.
- [Profilo Personale e Gestione dei Permessi delle App](./docs-12-common-personal-profile.md) — una guida per gestire il tuo profilo personale.
