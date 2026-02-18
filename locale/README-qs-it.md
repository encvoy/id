**[English](../README-qs.md)** | **[Español](README-qs-es.md)** | **Italiano** | **[Français](README-qs-fr.md)** | **[Deutsch](README-qs-de.md)**

## Avvio Rapido (Sviluppo Locale)

### 1. Clonare il repository

```bash
git clone https://github.com/encvoy/id.git
cd id
```

### 2. Aggiungere il dominio a hosts

File: `/etc/hosts`

```text
127.0.0.1 local.encvoy.com
```

### 3. Installare le dipendenze del progetto root

```bash
npm install
```

### 4. Installare le dipendenze di tutti i sottoprogetti

```bash
npm run init
```

### 5. Installare Docker Engine

Guida ufficiale:\
https://docs.docker.com/engine/install/

### 6. Preparare il file di ambiente

Copiare `.example.env` in `.local.env`\
(impostare le variabili se necessario):

```bash
cp .example.env .local.env
```

### 7. Configurare `.local.env`

Aggiungere o sovrascrivere variabili locali:

```env
VITE_CLIENT_ID=
VITE_CUSTOM_STYLES=
VITE_DATA_PROCESSING_POLICY_URL=
VITE_COPYRIGHT=
```

### 8. Solo Windows --- specificare il percorso di bash per gli script npm

**x86:**

```bash
npm config set script-shell "C:\Program Files (x86)\Git\bin\bash.exe"
```

**x64:**

```bash
npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

### 9. Avviare i container docker

```bash
docker compose up -d
```

### 10. Aggiornare la struttura del database

```bash
npm run prisma:update
```

### 11. Generare certificati SSL

#### Installare Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Aggiornare Homebrew

```bash
brew update
```

#### Installare mkcert

```bash
brew install mkcert
```

#### Installare l'Autorità di Certificazione locale

```bash
mkcert -install
```

Dopo un'installazione riuscita:

```text
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)!
```

#### Generare il certificato

```bash
mkcert local.encvoy.com
```

Spostare i certificati generati nella cartella `certs/`.

### 12. Installare e avviare nginx

#### macOS

Homebrew --- vedere passo 11.

Installare nginx:

```bash
brew install nginx
```

Avviare nginx:

```bash
npm run nginx:start
```

### 13. Avviare l'applicazione

```bash
npm run start
```
