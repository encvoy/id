---
title: "Login WebAuthn — Connessione in Encvoy ID"
description: "Scopri come connettere il login WebAuthn in Encvoy ID: crea un metodo di login e aggiungilo al widget di autorizzazione. Connettiti in pochi passaggi."
keywords:
  - WebAuthn login
  - autenticazione WebAuthn
  - connessione WebAuthn
  - configurazione WebAuthn
  - WebAuthn Encvoy ID
  - login tramite WebAuthn Encvoy ID
  - configurazione WebAuthn in Encvoy ID
author: "Team Encvoy ID"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via WebAuthn"
---

# Come connettere il login WebAuthn in Encvoy ID

> 📋 Questa istruzione fa parte di una serie di articoli sulla configurazione dei metodi di login. Per maggiori dettagli, consulta la guida [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md).

In questa guida imparerai come connettere l'autenticazione **WebAuthn** al sistema **Encvoy ID**.

**Sommario:**

- [Informazioni Generali](#general-info)
- [Configurazione dell'autenticazione WebAuthn per gli Amministratori](#webauthn-admin-setup)
- [Aggiunta di una chiave per un utente](#adding-key-for-user)
- [Vedi Anche](#see-also)

---

## Informazioni Generali { #general-info }

**WebAuthn** (Web Authentication) è uno standard di autenticazione che consente agli utenti di accedere senza password utilizzando metodi di verifica sicuri:

- biometria (Face ID, Touch ID);
- chiavi di sicurezza hardware;
- moduli di sicurezza integrati nei dispositivi.

**WebAuthn** fa parte della specifica **FIDO2** ed è supportato da tutti i browser moderni.

> 🔐 **WebAuthn** può essere utilizzato come metodo di login principale o come fattore aggiuntivo per l'autenticazione a più fattori.

### Come funziona WebAuthn

1. **Registrazione dell'utente:**
   - L'utente crea una chiave di autenticazione.
   - Il dispositivo genera una coppia di chiavi: la chiave pubblica viene memorizzata nel sistema, mentre la chiave privata rimane solo all'utente.

2. **Inizio del Login:**
   - L'utente seleziona il metodo di login **WebAuthn** sulla risorsa web.
   - Il server invia una sfida (`challenge`) per verificare l'identità.

3. **Autenticazione dell'utente:**
   - Il dispositivo o il token firma la `challenge` con la chiave privata.
   - Il server verifica la firma utilizzando la chiave pubblica memorizzata.
   - Se la firma è valida, all'utente viene concesso l'accesso.

4. **Stabilire un canale sicuro:** Dopo un'autenticazione riuscita, l'utente accede al sistema senza trasmettere alcuna password sulla rete.

---

## Configurazione dell'autenticazione WebAuthn per gli Amministratori { #webauthn-admin-setup }

### Passaggio 1. Creazione di un metodo di login

1. Vai al Pannello di Amministrazione → scheda **Impostazioni**.

   > 💡 Per creare un metodo di login per un'organizzazione, apri la **Dashboard dell'Organizzazione**. Se il metodo di login è necessario per un'applicazione specifica, apri le **impostazioni di quell'applicazione**.

2. Trova il blocco **Metodi di accesso** e clicca su **Configura**.
3. Nella finestra che si apre, clicca sul pulsante **Crea** ![Pulsante Crea](./images/button-create.webp "Pulsante Crea").
4. Si aprirà una finestra con un elenco di modelli.
5. Seleziona il modello **WebAuthn**.
6. Compila il modulo di creazione:

   **Informazioni di Base**
   - **Nome** — Il nome che gli utenti vedranno.
   - **Descrizione** (opzionale) — Una breve descrizione.
   - **Logo** (opzionale) — Puoi caricare la tua icona, altrimenti verrà utilizzata quella predefinita.

   **Impostazioni Aggiuntive**
   - **Metodo di accesso pubblico** — Abilita questa opzione affinché il metodo di login possa essere aggiunto al profilo utente come [identificatore di servizio esterno](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Pubblicità** — Imposta il livello di pubblicità predefinito per l'identificatore di servizio esterno nel profilo utente.

7. Clicca su **Crea**.

Dopo la creazione riuscita, il nuovo metodo di login apparirà nell'elenco generale dei provider.

### Passaggio 2. Aggiunta del provider WebAuthn al Widget

Per rendere visibile agli utenti il pulsante **WebAuthn** nel modulo di autorizzazione, è necessario attivare questa funzione nelle impostazioni del widget:

1. Trova il metodo di login creato nell'elenco generale dei provider.
2. Sposta l'interruttore sul pannello del provider in posizione "On".

> **Verifica**: Dopo il salvataggio, apri il modulo di login in un'applicazione di test. Un nuovo pulsante con il logo **WebAuthn** dovrebbe apparire sul widget.

---

## Aggiunta di una chiave per un utente { #adding-key-for-user }

### Passaggio 1. Aggiunta di una chiave al dispositivo

La registrazione di una chiave **WebAuthn** è il processo di creazione di una coppia di chiavi pubblica e privata e del loro collegamento a un utente specifico.

Per utilizzare il login **WebAuthn**, l'utente deve prima registrare una chiave: può trattarsi di un autenticatore integrato (es. **Touch ID**, **Face ID** o **Windows Hello**) o di una chiave di sicurezza fisica esterna.

Durante il processo di aggiunta della chiave, viene creata una coppia crittografica unica: **chiave pubblica** e **privata**.

- La chiave privata è memorizzata in modo sicuro sul dispositivo dell'utente e non viene mai trasmessa sulla rete.
- La chiave pubblica è memorizzata sul server **Encvoy ID** e viene utilizzata per la successiva verifica dell'autenticazione durante il login.

Dopo aver registrato la chiave, l'utente deve aggiungere l'identificatore **WebAuthn** al proprio profilo **Encvoy ID**.

### Passaggio 2. Aggiunta dell'identificatore al profilo

1. Vai al tuo **Profilo**.
2. Clicca su **Aggiungi** nel blocco **Identificatori**.

<img src="./images/personal-profile-12.webp" alt="Blocco identificatori nel profilo utente" style="max-width:600px; width:100%">

3. Nella finestra che si apre, seleziona il metodo di login **WebAuthn**.
4. Nella finestra di dialogo del sistema, specifica la chiave precedentemente registrata.

> 💡 **Suggerimento**: Se l'identificatore è già collegato a un altro utente, deve essere rimosso dal profilo di quell'utente prima di poter essere collegato al nuovo account.

---

## Vedi Anche { #see-also }

- [Metodi di Login e Configurazione del Widget](./docs-06-github-en-providers-settings.md) — una guida ai metodi di login e alla configurazione del widget di accesso.
- [Gestione dell'Organizzazione](./docs-09-common-mini-widget-settings.md) — una guida per lavorare con le organizzazioni nel sistema **Encvoy ID**.
- [Profilo Personale e Gestione dei Permessi App](./docs-12-common-personal-profile.md) — una guida alla gestione del proprio profilo personale.
