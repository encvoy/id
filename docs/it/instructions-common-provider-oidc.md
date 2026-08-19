# Come connettere il login OpenID Connect in Encvoy ID

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di login. Per maggiori dettagli, consulta la guida [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come connettere l'autenticazione **OpenID Connect** al sistema **Encvoy ID**.

La configurazione del login tramite **OpenID Connect** consiste in tre passaggi chiave eseguiti in due sistemi diversi:

- [Passaggio 1. Configurazione sul lato del sistema esterno](#step-1-configure-external-system)
- [Passaggio 2. Creazione di un metodo di login](#step-2-create-login-method)
- [Passaggio 3. Aggiunta al widget](#step-3-add-to-widget)
- [Descrizione dei parametri](#parameters-description)
- [Vedi anche](#see-also)

---

<a name="step-1-configure-external-system"></a>

## Passaggio 1. Configurazione sul lato del sistema esterno

1. Crea un'applicazione nel servizio di identità esterno.
2. Copia i valori dei campi **Application ID/Client ID** e **Secret/Client Secret**. Ti serviranno durante la creazione dell'applicazione in **Encvoy ID**.

---

<a name="step-2-create-login-method"></a>

## Passaggio 2. Creazione di un metodo di login

1. Vai al Pannello di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di login per un'organizzazione, apri la **Dashboard dell'Organizzazione**. Se il metodo di login è necessario per un'applicazione specifica, apri le **impostazioni di quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Pulsante Crea](./images/button-create.webp "Pulsante Crea").
4. Si aprirà una finestra con un elenco di modelli.
5. Seleziona il modello **OpenID Connect**.
6. Compila il modulo di creazione:

   **Informazioni di base**
   - **Nome** — Il nome che gli utenti visualizzeranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella predefinita.

   **Parametri di autenticazione**
   - **Identificativo risorsa (client_id)** — Incolla l'**Application ID** (`Client ID`) copiato.
   - **Chiave segreta (client_secret)** — Incolla il **Secret** (`Client Secret`) copiato.
   - **URL di reindirizzamento (Redirect URI)** — Questo campo verrà compilato automaticamente in base al tuo dominio.
   - **Indirizzo base del server di autorizzazione (issuer)** — L'indirizzo del servizio di identità esterno.
   - **Endpoint di autorizzazione (authorization_endpoint)** — L'indirizzo a cui l'utente viene reindirizzato per l'autorizzazione.
   - **Endpoint di emissione token (token_endpoint)** — La risorsa che fornisce l'emissione del token.
   - **Endpoint informazioni utente (userinfo_endpoint)** — La risorsa che restituisce informazioni sull'utente corrente.
   - **Permessi richiesti (scopes)** — Un elenco di permessi da richiedere al provider di identità. Per aggiungere un permesso, digita il suo nome e premi **Invio**.

   **Impostazioni aggiuntive**
   - **Metodo di accesso pubblico** — Abilita questa opzione se desideri che questo metodo di login sia disponibile per l'aggiunta ad altre applicazioni nel sistema (o organizzazione), nonché al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Pubblicità** — Imposta il livello di pubblicità predefinito per l'identificatore del servizio esterno nel profilo utente.

7. Clicca su **Crea**.

Dopo la creazione riuscita, il nuovo metodo di login apparirà nell'elenco generale dei provider.

---

<a name="step-3-add-to-widget"></a>

## Passaggio 3. Aggiunta al widget

Per rendere visibile il pulsante **Accedi con OpenID Connect** nel modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Trova il metodo di login creato nell'elenco generale dei provider.
2. Attiva l'interruttore sul pannello del provider.

> **Verifica**: Dopo il salvataggio, apri il modulo di login in un'applicazione di test. Sul widget dovrebbe apparire un nuovo pulsante con il logo **OpenID Connect**.

---

<a name="parameters-description"></a>

## Descrizione dei parametri

### Informazioni di base

| Nome            | Descrizione                                                                                         | Tipo                 | Limiti               |
| --------------- | --------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| **Nome**        | Il nome che verrà visualizzato nell'interfaccia del servizio **Encvoy ID**                          | Testo                | Max 50 caratteri     |
| **Descrizione** | Una breve descrizione che verrà visualizzata nell'interfaccia del servizio **Encvoy ID**            | Testo                | Max 255 caratteri    |
| **Logo**        | L'immagine che verrà visualizzata nell'interfaccia del servizio **Encvoy ID** e nel widget di login | JPG, GIF, PNG o WEBP | Dimensione max: 1 MB |

### Parametri di autenticazione

| Nome                                                          | Parametro                | Descrizione                                                                                                                    |
| ------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Identificativo risorsa (client_id)**                        | `client_id`              | ID dell'applicazione creata nel sistema esterno                                                                                |
| **Chiave segreta (client_secret)**                            | `client_secret`          | Chiave di accesso al servizio dell'applicazione creata sul lato del sistema esterno                                            |
| **URL di reindirizzamento (Redirect URI)** (non modificabile) | `redirect URI`           | L'indirizzo **Encvoy ID** a cui l'utente viene reindirizzato dopo l'autenticazione nel servizio di terze parti                 |
| **Indirizzo base del server di autorizzazione (issuer)**      | `issuer`                 | L'indirizzo del servizio di identità esterno                                                                                   |
| **Endpoint di autorizzazione (authorization_endpoint)**       | `authorization_endpoint` | L'indirizzo a cui l'utente viene reindirizzato per l'autorizzazione                                                            |
| **Endpoint di emissione token (token_endpoint)**              | `token_endpoint`         | La risorsa che fornisce l'emissione del token                                                                                  |
| **Endpoint informazioni utente (userinfo_endpoint)**          | `userinfo_endpoint`      | La risorsa che restituisce informazioni sull'utente corrente                                                                   |
| **Permessi richiesti (scopes)**                               | -                        | Un elenco di permessi da richiedere al provider di identità. Per aggiungere un permesso, digita il suo nome e premi **Invio**. |

### Impostazioni aggiuntive

| Nome                           | Descrizione                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metodo di accesso pubblico** | Quando attivato: <br> - Il metodo di login diventa disponibile per l'aggiunta ad altre applicazioni del servizio. <br> - Il metodo di login diventa disponibile per l'aggiunta come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers) nel profilo utente. |
| **Pubblicità**                 | Imposta il livello di pubblicità predefinito per l'identificatore del servizio esterno nel profilo utente                                                                                                                                                                                                       |

---

<a name="see-also"></a>

## Vedi anche

- [Metodi di Login e Configurazione del Widget di Login](./docs-06-github-en-providers-settings.md) — guida sui metodi di login e sulla configurazione del widget di login.
- [Gestione dell'Organizzazione](./docs-11-common-org-settings.md) — guida sull'utilizzo delle organizzazioni nel sistema **Encvoy ID**.
- [Profilo Personale e Gestione dei Permessi delle Applicazioni](./docs-12-common-personal-profile.md) — guida sulla gestione del profilo personale.
