---
title: "Login mTLS — Connessione in Encvoy ID"
description: "Scopri come abilitare il login mTLS in Encvoy ID: crea un metodo di login e aggiungilo al widget di autorizzazione. Connettiti in pochi passaggi."
keywords:
  - login mTLS
  - autenticazione mTLS
  - connessione mTLS
  - configurazione mTLS
  - mTLS Encvoy ID
  - login via mTLS Encvoy ID
  - impostazione mTLS in Encvoy ID
date: 2025-12-12
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Login via mTLS"
---

# Come connettere il login mTLS in Encvoy ID

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di login. Per maggiori dettagli, consulta la guida [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come connettere l'autenticazione **mTLS** al sistema **Encvoy ID**.

L'impostazione del login tramite **mTLS** si compone di diverse fasi chiave:

1. Configurazione dell'autenticazione mTLS per gli amministratori di **Encvoy ID**
   - [Passaggio 1. Configurare Nginx per mTLS](#step-1-configure-nginx-for-mtls)
   - [Passaggio 2. Creare il Provider mTLS](#step-2-create-mtls-provider)
   - [Passaggio 3. Aggiungere il Provider mTLS al Widget](#step-3-add-mtls-to-widget)

2. Collegamento di un certificato client per gli utenti di **Encvoy ID**
   - [Passaggio 1. Installare il Certificato Client nel Browser](#step-1-install-client-certificate)
   - [Passaggio 2. Aggiungere l'Identificatore al Profilo](#step-2-add-identifier-to-profile)
   - [Passaggio 3. Verificare](#step-3-verify)

---

## Informazioni Generali

**mTLS** (Mutual TLS) è un metodo di autenticazione basato sulla verifica reciproca dei certificati client e server.

Questo metodo garantisce un elevato livello di fiducia e sicurezza, poiché l'accesso al sistema è possibile solo se l'utente possiede un certificato valido firmato da un'Autorità di Certificazione (CA) fidata.

**mTLS** è particolarmente utile per sistemi aziendali o sensibili dove è richiesto di ridurre al minimo il rischio di accessi non autorizzati.

### Flusso di lavoro mTLS

1. **Inizio Connessione:** Il client invia una richiesta al server **Encvoy ID**.
2. **Richiesta Certificato Client:** Il server richiede la fornitura di un certificato client.
3. **Invio Certificato Client:** Il client fornisce il proprio certificato firmato da una CA fidata.
4. **Verifica del Certificato sul Server:**
   - Il server verifica il certificato rispetto alla CA radice.
   - Controlla la data di scadenza, la firma e la conformità ai requisiti di sicurezza.

5. **Autenticazione Utente:**
   - Se il certificato è valido, il server lo associa all'account utente e concede l'accesso.
   - Se il certificato è invalido o mancante, l'accesso viene negato.

6. **Stabilire un Canale Sicuro:** Dopo la verifica riuscita del certificato, viene stabilita una **connessione crittografata** e l'utente ottiene l'accesso.

---

## Configurazione dell'autenticazione mTLS per gli amministratori di Encvoy ID

Affinché **mTLS** funzioni, è necessario:

- configurare il server web **Nginx** per accettare solo richieste firmate da un certificato fidato;
- creare e attivare il provider **mTLS** nell'interfaccia di **Encvoy ID**;
- installare i certificati client sui dispositivi degli utenti.

### Passaggio 1. Configurare Nginx per mTLS { #step-1-configure-nginx-for-mtls }

Prima di aggiungere il provider in **Encvoy ID**, è necessario preparare la configurazione di **Nginx**:

1. Apri il file di configurazione `nginx.local.conf`.
2. Aggiungi un nuovo blocco `server`:

   **Esempio di Configurazione**:

   ```nginx
   server {
      server_name local.trusted.com;
      listen 3443 ssl;

      # Certificati del server
      ssl_certificate         certs/local.trusted.com.pem;
      ssl_certificate_key     certs/local.trusted.com-key.pem;

      # Certificato Root CA per la verifica del certificato client
      ssl_client_certificate  certs/ca-bundle.crt;
      ssl_verify_client on;
      ssl_verify_depth 3;

      # Impostazioni di sessione e protocollo
      ssl_session_timeout 10m;
      ssl_session_cache shared:SSL:10m;
      ssl_protocols TLSv1.2 TLSv1.3;

      # Limitazione accesso al percorso principale, mTLS consentito solo per /api/mtls
      location / {
          return 404 "mTLS endpoints only. Use port 443 for regular access.";
      }

      # Impostazioni proxy per il backend
      location /api/mtls {
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;

          # Passaggio informazioni certificato client
          proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
          proxy_set_header X-SSL-Client-DN $ssl_client_s_dn;
          proxy_set_header X-SSL-Client-Serial $ssl_client_serial;
          proxy_set_header X-SSL-Client-Fingerprint $ssl_client_fingerprint;
          proxy_set_header X-SSL-Client-Issuer $ssl_client_i_dn;

          # Proxy verso il backend
          proxy_pass http://backend;
          proxy_redirect off;
      }
   }
   ```

3. Riavvia **Nginx** dopo aver apportato le modifiche.

#### Descrizione dei Parametri

| Parametro                         | Scopo                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| `ssl_certificate`                 | Certificato del server utilizzato per HTTPS.                 |
| `ssl_certificate_key`             | Chiave privata del server.                                   |
| `ssl_client_certificate`          | Certificato Root CA per la verifica dei certificati client.  |
| `ssl_verify_client on`            | Abilita la verifica obbligatoria del certificato client.     |
| `ssl_verify_depth`                | Profondità massima della catena di verifica del certificato. |
| `ssl_session_timeout`             | Durata della sessione SSL.                                   |
| `ssl_protocols`                   | Versioni TLS consentite.                                     |
| `proxy_set_header X-SSL-Client-*` | Passa le informazioni del certificato client al backend.     |

- Posiziona i certificati del server (`.pem` e chiave) e la CA radice (`ca-bundle.crt`) in una directory comoda, ad es. `certs/`.
- Specifica il percorso dei certificati nella configurazione di **Nginx**.

### Passaggio 2. Creare il Provider mTLS { #step-2-create-mtls-provider }

1. Vai al Pannello di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di login per un'organizzazione, apri la **Dashboard dell'Organizzazione**. Se il metodo di login è necessario per un'applicazione specifica, apri le **Impostazioni per quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Pulsante Crea](./images/button-create.webp "Pulsante Crea").
4. Si aprirà una finestra con un elenco di modelli.
5. Seleziona il modello **mTLS**.
6. Compila il modulo di creazione:

   **Informazioni di Base**
   - **Nome** — Il nome che gli utenti vedranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella predefinita.

   **Impostazioni Aggiuntive**
   - **Metodo di accesso pubblico** — Abilita questa opzione affinché il metodo di login possa essere aggiunto al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Pubblicità** — Imposta il livello di pubblicità predefinito per l'identificatore del servizio esterno nel profilo utente.

7. Clicca su **Crea**.

Dopo la creazione riuscita, il nuovo metodo di login apparirà nell'elenco generale dei provider.

### Passaggio 3. Aggiungere il Provider mTLS al Widget { #step-3-add-mtls-to-widget }

Affinché gli utenti vedano il pulsante **mTLS** nel modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Trova il metodo di login creato nell'elenco generale dei provider.
2. Attiva l'interruttore sul pannello del provider.

> **Verifica**: Dopo il salvataggio, apri il modulo di login in un'applicazione di test. Un nuovo pulsante con il logo **mTLS** dovrebbe apparire sul widget.

---

## Collegamento di un certificato client per gli utenti di Encvoy ID

> 📌 Questa istruzione è destinata agli utenti che devono accedere al sistema tramite **mTLS**.

### Passaggio 1. Installare il Certificato Client nel Browser { #step-1-install-client-certificate }

Prima dell'installazione, assicurati di avere un file di certificato in formato `.p12` o `.pfx`.

Questo file deve contenere:

- il tuo certificato personale,
- la chiave privata,
- e la catena di fiducia (se richiesta).

#### Installazione in Google Chrome / Microsoft Edge

1. Apri il browser **Chrome** o **Edge**.
2. Vai su **Impostazioni** → **Privacy e sicurezza**.
3. Trova la sezione **Sicurezza**.
4. Clicca su **Gestisci certificati**.
5. Vai alla scheda **Personale** / **I tuoi certificati**.
6. Clicca su **Importa...**.
7. Nell'Importazione guidata, clicca su **Avanti**.
8. Clicca su **Sfoglia** e seleziona il tuo file `.p12` o `.pfx`.
9. Inserisci la password ricevuta con il certificato.
10. Seleziona **Archivia tutti i certificati nel seguente archivio**.
11. Clicca su **Sfoglia** e seleziona **Personale**.
12. Clicca su **Avanti** → **Fine**.
13. Se appare un avviso di sicurezza, clicca su **Sì**.

Dopo l'installazione riuscita, il certificato apparirà nell'elenco della scheda **Personale** / **I tuoi certificati**.

#### Installazione in Mozilla Firefox

1. Apri il menu di **Firefox** → **Impostazioni**
2. Vai alla sezione **Privacy e sicurezza**
3. Scorri verso il basso fino a **Certificati**
4. Clicca su **Mostra certificati...**
5. Vai alla scheda **Certificati personali**
6. Clicca su **Importa...**
7. Seleziona il tuo file `.p12` o `.pfx`
8. Inserisci la password del certificato
9. Clicca su **OK**

Dopo l'installazione riuscita, il certificato apparirà nell'elenco della scheda **Certificati personali**.

> ⚠️ I certificati devono essere installati solo su dispositivi fidati e la password deve essere conservata in modo strettamente sicuro.

> 💡 Dopo aver installato il certificato, al momento del login via **mTLS**, il browser ti chiederà automaticamente di selezionare il certificato appropriato per l'autenticazione.

### Passaggio 2. Aggiungere l'Identificatore al Profilo { #step-2-add-identifier-to-profile }

1. Vai al tuo **Profilo**.
2. Clicca su **Aggiungi** nel blocco **Identificatori**.

<img src="./images/personal-profile-12.webp" alt="Blocco identificatori nel profilo utente" style="max-width:600px; width:100%">

3. Nella finestra che si apre, seleziona il metodo di login **mTLS**.
4. Seleziona il certificato installato nel passaggio precedente.

> 💡 **Suggerimento**: Se l'identificatore è già collegato a un altro utente, devi rimuoverlo dal profilo di quell'utente prima di collegarlo al nuovo account.

### Passaggio 3. Verificare { #step-3-verify }

1. Vai alla pagina di login con il metodo di login **mTLS** abilitato.
2. Seleziona l'icona del metodo di login **mTLS**.
   - **Primo login**: il sistema potrebbe chiederti di selezionare un certificato client.
   - **Login successivi**: l'autenticazione viene eseguita automaticamente utilizzando il certificato selezionato in precedenza.

---

## Vedi Anche

- [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md) — guida sui metodi di login e sulla configurazione del widget di login.
- [Gestione dell'Organizzazione](./docs-09-common-mini-widget-settings.md) — guida sul lavoro con le organizzazioni nel sistema **Encvoy ID**.
- [Profilo Personale e Gestione dei Permessi App](./docs-12-common-personal-profile.md) — guida sulla gestione del proprio profilo personale.
