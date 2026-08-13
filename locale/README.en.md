# OpenID Connect (OIDC) Authorization Server

OpenID Connect (OIDC) compliant authorization server / SSO token
issuance service.

- [Russian](../README.md)

## Quick Start (Local Development Setup)

### 1. Clone the repository

```bash
git clone https://git.digtlab.ru/trustedplus/idtrustednode.git
cd idtrustednode
```

### 2. Add local domain to hosts file

**Linux / macOS:** `/etc/hosts`\
**Windows:** `C:\Windows\System32\drivers\etc\hosts`

Add the following line:

```text
127.0.0.1 local.trusted.com
```

### 3. Install root project dependencies

```bash
npm install
```

### 4. Install dependencies of all sub-projects

```bash
npm run init
```

### 5. Install Docker

Follow the official guide:\
https://docs.docker.com/engine/install/

### 6. Prepare environment file

Copy `.example.env` → `.local.env`:

```bash
cp .example.env .local.env
```

### 7. Configure `.local.env`

At minimum, fill or override these variables:

```env
VITE_CLIENT_ID=your-client-id-here
VITE_CUSTOM_STYLES=
VITE_DATA_PROCESSING_POLICY_URL=https://example.com/privacy
VITE_COPYRIGHT="© 2025 Your Company"
```

(Add other variables as needed.)

### 8. Windows only -- set bash as npm script shell

Choose the correct path depending on your Git installation.

**64-bit Git:**

```bash
npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

**32-bit Git:**

```bash
npm config set script-shell "C:\Program Files (x86)\Git\bin\bash.exe"
```

### 9. Start infrastructure (PostgreSQL, etc.)

```bash
docker compose up -d
```

### 10. Update database schema / run migrations

```bash
npm run prisma:update
```

### 11. Generate self-signed SSL certificates for `local.trusted.com`

```bash
# 1. Install Homebrew (if not present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Update brew
brew update

# 3. Install mkcert
brew install mkcert

# 4. Install local CA into system trust stores
mkcert -install

# 5. Generate certificate
mkcert local.trusted.com

# 6. Move files to certs/ folder
mkdir -p certs
mv local.trusted.com.pem certs/
mv local.trusted.com-key.pem certs/
```

### 12. Install & configure local nginx (HTTPS termination)

**macOS:**

```bash
brew install nginx
npm run nginx:start
```

> On Linux/Windows you may need to install nginx manually\
> and use the configuration provided in the project.

### 13. Start the application

```bash
npm run start
```

After that, the service should be available at:

👉 **https://local.encvoy.com**

# Localization

This directory contains localization files for the project. Localization allows the application to be adapted for users speaking different languages.

## Structure

- **ru/**: Localization for Russian language.
- **en/**: Localization for English language.
- **...**: Other languages can be added as needed.

## How to Add a New Language

1. Create a new folder with the language code (e.g., `fr` for French).
2. Copy the contents from the `en` folder into the new folder.
3. Translate the strings in the files to the new language.

## Usage

Localization is loaded automatically based on user settings or browser language. Make sure all strings are translated and added to the corresponding localization files.
