# Come connettere il Login GitHub in Encvoy ID

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di accesso. Per maggiori dettagli, consulta la guida [Metodi di Accesso e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come connettere l'autenticazione tramite un account **GitHub** al sistema **Encvoy ID**. Questo metodo di accesso consente agli utenti di accedere alle applicazioni utilizzando il proprio account del servizio **GitHub**.

La configurazione del login **GitHub** consiste in tre passaggi chiave eseguiti in due sistemi diversi.

- [Passaggio 1. Configura l'App GitHub](#passaggio-1-configura-lapp-github)
- [Passaggio 2. Crea il Metodo di Accesso](#passaggio-2-crea-il-metodo-di-accesso)
- [Passaggio 3. Aggiungi al Widget](#passaggio-3-aggiungi-al-widget)

---

<a name="step-1-configure-github-app"></a>

## Passaggio 1. Configura l'App GitHub

Prima di configurare il metodo di accesso in **Encvoy ID**, devi registrare la tua applicazione nella console sviluppatori di **GitHub** e ottenere le chiavi di accesso:

1. Vai alle impostazioni di **GitHub** tramite il link:
   [https://github.com/settings/developers](https://github.com/settings/developers)

2. Nella sezione **OAuth Apps**, clicca su **New OAuth App**.
3. Compila le impostazioni dell'applicazione richieste:
   - **Application name** - il nome dell'applicazione,
   - **Homepage URL** - l'indirizzo dell'installazione del servizio,
   - **Authorization callback URL** - l'indirizzo nel formato `https://<indirizzo_installazione>/api/interaction/code`.

   <img src="./images/instructions-provider-github-01.webp" alt="Creazione di un metodo di login GitHub OAuth nella console sviluppatori del servizio" style="max-width:400px; width:100%">

4. Clicca su **Register application**.
5. Dopo aver creato l'applicazione, apri le sue impostazioni e copia:
   - **Client ID**
   - **Client Secret** (creato tramite il pulsante **Generate a new client secret**)

   <img src="./images/instructions-provider-github-02.webp" alt="Creazione di un metodo di login GitHub OAuth nella console sviluppatori del servizio" style="max-width:700px; width:100%">

Questi valori saranno necessari nel passaggio successivo.

---

<a name="step-2-create-login-method"></a>

## Passaggio 2. Crea il Metodo di Accesso

1. Vai alla Console di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di accesso per un'organizzazione, apri la **Console dell'Organizzazione**. Se il metodo di accesso è necessario per un'applicazione specifica, apri le **impostazioni di quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Pulsante Crea](./images/button-create.webp "Pulsante Crea").
4. Si aprirà una finestra con un elenco di template.
5. Seleziona il template **GitHub**.
6. Compila il modulo di creazione:

   **Informazioni di Base**
   - **Nome** — Il nome che gli utenti visualizzeranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella standard.

   **Parametri di Autenticazione**
   - **Identificativo risorsa (client_id)** — Incolla il **Client ID** copiato.
   - **Chiave segreta (client_secret)** — Incolla il **Client Secret** copiato.
   - **URL di reindirizzamento (Redirect URI)** — Questo campo verrà compilato automaticamente in base al tuo dominio.

   **Impostazioni Aggiuntive**
   - **Metodo di accesso pubblico** — Abilita questa opzione se desideri che questo metodo di accesso sia disponibile per l'aggiunta ad altre applicazioni nel sistema (o organizzazione), nonché al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Pubblicità** — Configura il livello di pubblicità predefinito per l'identificatore del servizio esterno nel profilo utente.

7. Clicca su **Crea**.

Dopo la creazione con successo, il nuovo metodo di accesso apparirà nell'elenco generale dei provider.

---

<a name="step-3-add-to-widget"></a>

## Passaggio 3. Aggiungi al Widget

Per rendere visibile il pulsante **Accedi con GitHub** nel modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Nell'elenco generale dei provider, trova il metodo di accesso creato.
2. Attiva l'interruttore sul pannello del provider.

> **Verifica**: Dopo il salvataggio, apri il modulo di accesso in un'applicazione di test. Un nuovo pulsante con il logo **GitHub** dovrebbe apparire sul widget.

---

## Descrizione dei Parametri

### Informazioni di Base

| Nome            | Descrizione                                                                                           | Tipo                 | Vincoli              |
| --------------- | ----------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| **Nome**        | Il nome che verrà visualizzato nell'interfaccia del servizio **Encvoy ID**                            | Testo                | Max. 50 caratteri    |
| **Descrizione** | Una breve descrizione che verrà visualizzata nell'interfaccia del servizio **Encvoy ID**              | Testo                | Max. 255 caratteri   |
| **Logo**        | L'immagine che verrà visualizzata nell'interfaccia del servizio **Encvoy ID** e nel widget di accesso | JPG, GIF, PNG o WEBP | Dimensione max: 1 MB |

### Parametri di Autenticazione

| Nome                                                          | Parametro       | Descrizione                                                                                                       |
| ------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Identificativo risorsa (client_id)**                        | `Client_id`     | L'ID dell'applicazione creata in **GitHub**                                                                       |
| **Chiave segreta (client_secret)**                            | `Client_secret` | La chiave di accesso al servizio dell'applicazione creata in **GitHub**                                           |
| **URL di reindirizzamento (Redirect URI)** (non modificabile) | `Redirect URI`  | L'indirizzo **Encvoy ID** al quale l'utente viene reindirizzato dopo l'autenticazione nel servizio di terze parti |

### Impostazioni Aggiuntive

| Nome                           | Descrizione                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metodo di accesso pubblico** | Quando attivato: <br> - Il metodo di accesso diventa disponibile per l'aggiunta ad altre applicazioni del servizio. <br> - Il metodo di accesso diventa disponibile per l'aggiunta come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers) nel profilo utente. |
| **Pubblicità**                 | Imposta il livello di pubblicità predefinito per l'identificatore del servizio esterno nel profilo utente                                                                                                                                                                                                           |

---

## Vedi Anche

- [Metodi di Accesso e Configurazione del Widget di Accesso](./docs-06-github-en-providers-settings.md) — una guida ai metodi di accesso e alla configurazione del widget di login.
- [Gestione dell'Organizzazione](./docs-11-common-org-settings.md) — una guida per lavorare con le organizzazioni nel sistema **Encvoy ID**.
- [Profilo Personale e Gestione dei Permessi delle Applicazioni](./docs-12-common-personal-profile.md) — una guida alla gestione del profilo personale.
