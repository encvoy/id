---
title: "Installazione di Encvoy ID tramite Docker — Distribuzione SSO"
description: "Installa Encvoy ID tramite Docker: requisiti, configurazione e primo accesso. Guida passo-passo alla distribuzione SSO per amministratori e DevOps."
keywords:
  - installare Encvoy ID
  - installazione Encvoy ID
  - distribuzione sistema SSO
  - deploy Encvoy ID
  - installazione docker Encvoy ID
  - docker compose Encvoy ID
  - sistema SSO enterprise
author: "Team Encvoy ID"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Installazione e Primo Avvio"
order: 2
---

# Come installare Encvoy ID

In questa guida imparerai come installare il sistema SSO **Encvoy ID** tramite Docker sul tuo server. Attraverseremo l'intero processo: dalla preparazione dell'ambiente al primo accesso dell'amministratore.

**Contenuti:**

- [Requisiti di installazione](#installation-requirements)
- [Installazione di Docker e Docker Compose](#install-docker-and-docker-compose)
- [Installazione del sistema SSO](#install-sso-system)
- [Primo accesso](#first-login)
- [Vedi anche](#see-also)

---

## Requisiti di installazione { #installation-requirements }

### Requisiti di sistema del server

Prima di installare il sistema **Encvoy ID**, assicurati che la tua infrastruttura soddisfi i requisiti.

I requisiti di sistema dipendono dal carico previsto. Una configurazione minima è sufficiente per gli ambienti di test, mentre i parametri consigliati dovrebbero essere utilizzati per gli ambienti di produzione.

#### Configurazione minima

| Componente              | Requisiti     |
| ----------------------- | ------------- |
| **RAM**                 | 4 GB          |
| **Spazio su disco**     | 50 GB SSD     |
| **Processore (CPU)**    | 2 core x86_64 |
| **Interfaccia di rete** | 1 Gbps        |

#### Configurazione consigliata

| Componente              | Requisiti          |
| ----------------------- | ------------------ |
| **RAM**                 | 8 GB o superiore   |
| **Spazio su disco**     | 100 GB SSD/NVMe    |
| **Processore (CPU)**    | 4+ core x86_64     |
| **Interfaccia di rete** | 1 Gbps e superiore |

> 💡 **Suggerimento:** Per sistemi ad alto carico con migliaia di utenti, si consiglia di utilizzare: <br>
>
> - 16+ GB RAM<br>
> - 8+ core CPU<br>
> - Unità NVMe per le massime prestazioni del database

### Requisiti software

#### Software

| Componente            | Versioni supportate                                                                             | Informazioni aggiuntive                           |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Sistema Operativo** | Ubuntu 18.04 LTS (Bionic Beaver), <br> Ubuntu 20.04 LTS (Focal Fossa),<br> Debian 11 (Bullseye) | Qualsiasi distribuzione Linux con supporto Docker |
| **Docker Engine**     | 19.03+                                                                                          | -                                                 |
| **Docker Compose**    | 1.27+                                                                                           | -                                                 |
| **Nginx/Apache**      | Qualsiasi versione moderna                                                                      | -                                                 |

#### Requisiti generali

Per una corretta installazione e funzionamento di **Encvoy ID**, devono essere soddisfatte diverse condizioni:

- Un server con un indirizzo IP statico.
- Accesso a tutte le workstation tramite la porta che verrà utilizzata per accedere al sistema.
- Disponibilità di un server email (server SMTP).
- La connessione al servizio deve essere stabilita tramite protocollo HTTPS.

---

## Installazione di Docker e Docker Compose { #install-docker-and-docker-compose }

**Encvoy ID** viene distribuito come un insieme di container Docker e può essere utilizzato come Server di Autorizzazione OAuth 2.0 aziendale e Provider OpenID Connect (IdP).

> 📚 [Documentazione Docker](https://docs.docker.com/engine/install/)

### Passaggio 1. Installazione di Docker Engine

**Per Ubuntu/Debian:**

```bash
# Aggiorna i pacchetti
sudo apt update && sudo apt upgrade -y

# Installa le dipendenze
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Aggiungi la chiave GPG di Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Aggiungi il repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installa Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verifica l'installazione
sudo docker --version
```

**Per CentOS/RHEL:**

```bash
# Installa yum-utils
sudo yum install -y yum-utils

# Aggiungi il repository Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Installa Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Avvia e abilita Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verifica l'installazione
sudo docker --version
```

### Passaggio 2. Installazione di Docker Compose

```bash
# Scarica Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Imposta i permessi di esecuzione
sudo chmod +x /usr/local/bin/docker-compose

# Verifica l'installazione
docker-compose --version
```

> 💡 Requisiti di versione: **Docker Engine 20.10+** e **Docker Compose 1.29+**. Usa `docker --version` e `docker-compose --version` per verificare.

---

## Installazione del sistema SSO { #install-sso-system }

### Passaggio 1. Preparazione della directory di lavoro

Crea e accedi alla directory di installazione:

```bash
# Crea la directory
mkdir trusted-id && cd trusted-id

# Controlla il percorso attuale
pwd  # Dovrebbe mostrare: /home/tuo_utente/trusted-id
```

### Passaggio 2. Download dei file di configurazione

Scarica i file di configurazione necessari:

```bash
# Scarica i file principali
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/docker-compose.yaml
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/nginx.conf
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/build.sh
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/.env

# Verifica il download
ls -la
```

**File scaricati:**

| File                    | Scopo                               |
| ----------------------- | ----------------------------------- |
| **docker-compose.yaml** | Configurazione dei container Docker |
| **nginx.conf**          | Impostazioni del server web Nginx   |
| **build.sh**            | Script di configurazione e build    |
| **.env**                | Variabili d'ambiente e impostazioni |

### Passaggio 3. Impostazione dei permessi

Rendi eseguibile lo script di build:

```bash
# Imposta i permessi per lo script di build
chmod +x ./build.sh

# Verifica i permessi
ls -l build.sh
```

> ⚙️ Dopo l'installazione, si consiglia di eseguire la configurazione di base. Una descrizione dettagliata di tutti i parametri è disponibile nella sezione [Variabili d'ambiente di Encvoy ID](./docs-03-box-system-configuration.md).

### Passaggio 4. Configurazione delle impostazioni

Modifica il file `.env` con le impostazioni principali:

```bash
# Apri il file per la modifica (usa nano o vim)
nano .env
```

**Impostazioni richieste:**

```env
# Dominio principale del sistema
ID_HOST=id.example.com  # Sostituisci con il tuo dominio o IP

# Email dell'amministratore
ADMIN_MAIL=example@mail.com  # Sostituisci con un'email reale
```

### Passaggio 5. Esecuzione dello script di build

Esegui lo script di configurazione:

```bash
./build.sh
```

Come risultato, il valore della variabile **ID_HOST** verrà scritto nel file **nginx.conf**, e le variabili **CLIENT_ID** e **CLIENT_SECRET** verranno scritte nel file **.env**.

### Passaggio 6. Avvio del sistema

Avvia il progetto:

```bash
docker compose up -d
```

### Comandi utili di Docker Compose

| Comando            | Descrizione                       | Esempio di utilizzo      |
| ------------------ | --------------------------------- | ------------------------ |
| **Visualizza log** | Monitora i log in tempo reale     | `docker compose logs -f` |
| **Ferma**          | Ferma tutti i container           | `docker compose stop`    |
| **Avvia**          | Avvia i container fermati         | `docker compose start`   |
| **Riavvia**        | Riavvia tutti i container         | `docker compose restart` |
| **Stato**          | Visualizza lo stato dei container | `docker compose ps`      |

---

## Primo accesso { #first-login }

### Credenziali predefinite dell'amministratore

Dopo l'installazione, viene creato un account amministrativo con diritti di **Amministratore**:

- **Login** — `root`,
- **Password** — `changethis`,
- **Ruolo** — **Amministratore**.

> 📌 Queste credenziali forniscono l'accesso completo al sistema. Assicurati di cambiare la password immediatamente dopo il primo accesso.

### Primo accesso

Per accedere all'interfaccia web di **Encvoy ID**, naviga su: `https://ID_HOST`.

1. Nel primo passaggio del widget di accesso, inserisci il login e clicca su **Accedi**.
2. Inserisci la password nel secondo passaggio e clicca su **Accedi**.

Dopo l'autorizzazione, sarai reindirizzato al [Profilo](./docs-12-common-personal-profile.md) dell'utente.

### Accesso al Pannello di Amministrazione { #admin-panel-access }

Le impostazioni di amministrazione si trovano nel Pannello di Amministrazione.

Per accedere al pannello:

1. Clicca sul tuo nome nell'angolo in alto a destra della finestra.
2. Nel mini-widget che si apre, clicca sul nome del servizio **Encvoy ID**.
3. Sarai reindirizzato al **Pannello di Amministrazione**.

---

## Vedi anche { #see-also }

- [Descrizione del sistema Encvoy ID](./docs-01-box-about.md) — panoramica delle funzionalità di **Encvoy ID**.
- [Variabili d'ambiente di Encvoy ID](./docs-03-box-system-configuration.md) — guida per la preparazione della configurazione prima dell'avvio.
- [Configurazione del sistema](./docs-04-box-system-settings.md) — guida per la configurazione dell'interfaccia e dell'accesso degli utenti al sistema.
