**English** | **[Español](/locale/README-qs-es.md)** | **[Italiano](/locale/README-qs-it.md)** | **[Français](/locale/README-qs-fr.md)** | **[Deutsch](/locale/README-qs-de.md)**

## Quick Start (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/encvoy/id.git
cd id
```

### 2. Add domain to hosts

File: `/etc/hosts`

```text
127.0.0.1 local.encvoy.com
```

### 3. Install root project dependencies

```bash
npm install
```

### 4. Install dependencies for all subprojects

```bash
npm run init
```

### 5. Install Docker Engine

Official guide:\
https://docs.docker.com/engine/install/

### 6. Prepare environment file

Copy `.example.env` to `.local.env`\
(set your variables if needed):

```bash
cp .example.env .local.env
```

### 7. Configure `.local.env`

Add or override local variables:

```env
VITE_CLIENT_DOMAIN=
VITE_CLIENT_SECRET=
VITE_CLIENT_ID=
VITE_CUSTOM_STYLES=
```

### 8. Windows only --- specify bash path for npm scripts

**x86:**

```bash
npm config set script-shell "C:\Program Files (x86)\Git\bin\bash.exe"
```

**x64:**

```bash
npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

### 9. Start docker containers

```bash
docker compose up -d
```

### 10. Update database structure

```bash
npm run prisma:update
```

### 11. Generate SSL certificates

#### Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Update Homebrew

```bash
brew update
```

#### Install mkcert

```bash
brew install mkcert
```

#### Install local Certificate Authority

```bash
mkcert -install
```

After successful installation:

```text
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)!
```

#### Generate certificate

```bash
mkcert local.encvoy.com
```

Move generated certificates to `certs/` folder.

### 12. Install and start nginx

#### macOS

Homebrew --- see step 11.

Install nginx:

```bash
brew install nginx
```

Start nginx:

```bash
npm run nginx:start
```

### 13. Start the application

```bash
npm run start
```
