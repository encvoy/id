**[English](../README-qs.md)** | **[Español](README-qs-es.md)** | **[Italiano](README-qs-it.md)** | **[Français](README-qs-fr.md)** | **Deutsch**

## Schnellstart (Lokale Entwicklung)

### 1. Repository klonen

```bash
git clone https://github.com/encvoy/id.git
cd id
```

### 2. Domain zu hosts hinzufügen

Datei: `/etc/hosts`

```text
127.0.0.1 local.encvoy.com
```

### 3. Root-Projekt-Abhängigkeiten installieren

```bash
npm install
```

### 4. Abhängigkeiten aller Unterprojekte installieren

```bash
npm run init
```

### 5. Docker Engine installieren

Offizielle Anleitung:\
https://docs.docker.com/engine/install/

### 6. Umgebungsdatei vorbereiten

Kopieren Sie `.example.env` nach `.local.env`\
(setzen Sie Ihre Variablen bei Bedarf):

```bash
cp .example.env .local.env
```

### 7. `.local.env` konfigurieren

Fügen Sie lokale Variablen hinzu oder überschreiben Sie diese:

```env
VITE_CLIENT_ID=
VITE_CUSTOM_STYLES=
VITE_DATA_PROCESSING_POLICY_URL=
VITE_COPYRIGHT=
```

### 8. Nur Windows --- Bash-Pfad für npm-Skripte angeben

**x86:**

```bash
npm config set script-shell "C:\Program Files (x86)\Git\bin\bash.exe"
```

**x64:**

```bash
npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

### 9. Docker-Container starten

```bash
docker compose up -d
```

### 10. Datenbankstruktur aktualisieren

```bash
npm run prisma:update
```

### 11. SSL-Zertifikate generieren

#### Homebrew installieren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Homebrew aktualisieren

```bash
brew update
```

#### mkcert installieren

```bash
brew install mkcert
```

#### Lokale Zertifizierungsstelle installieren

```bash
mkcert -install
```

Nach erfolgreicher Installation:

```text
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)!
```

#### Zertifikat generieren

```bash
mkcert local.encvoy.com
```

Verschieben Sie die generierten Zertifikate in den Ordner `certs/`.

### 12. nginx installieren und starten

#### macOS

Homebrew --- siehe Schritt 11.

nginx installieren:

```bash
brew install nginx
```

nginx starten:

```bash
npm run nginx:start
```

### 13. Anwendung starten

```bash
npm run start
```
