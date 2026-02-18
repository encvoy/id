**[English](../README-qs.md)** | **[Español](README-qs-es.md)** | **[Italiano](README-qs-it.md)** | **Français** | **[Deutsch](README-qs-de.md)**

## Démarrage Rapide (Développement Local)

### 1. Cloner le dépôt

```bash
git clone https://github.com/encvoy/id.git
cd id
```

### 2. Ajouter le domaine à hosts

Fichier : `/etc/hosts`

```text
127.0.0.1 local.encvoy.com
```

### 3. Installer les dépendances du projet racine

```bash
npm install
```

### 4. Installer les dépendances de tous les sous-projets

```bash
npm run init
```

### 5. Installer Docker Engine

Guide officiel :\
https://docs.docker.com/engine/install/

### 6. Préparer le fichier d'environnement

Copier `.example.env` vers `.local.env`\
(définissez vos variables si nécessaire) :

```bash
cp .example.env .local.env
```

### 7. Configurer `.local.env`

Ajouter ou remplacer les variables locales :

```env
VITE_CLIENT_ID=
VITE_CUSTOM_STYLES=
VITE_DATA_PROCESSING_POLICY_URL=
VITE_COPYRIGHT=
```

### 8. Windows uniquement --- spécifier le chemin bash pour les scripts npm

**x86 :**

```bash
npm config set script-shell "C:\Program Files (x86)\Git\bin\bash.exe"
```

**x64 :**

```bash
npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

### 9. Démarrer les conteneurs docker

```bash
docker compose up -d
```

### 10. Mettre à jour la structure de la base de données

```bash
npm run prisma:update
```

### 11. Générer les certificats SSL

#### Installer Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Mettre à jour Homebrew

```bash
brew update
```

#### Installer mkcert

```bash
brew install mkcert
```

#### Installer l'Autorité de Certification locale

```bash
mkcert -install
```

Après une installation réussie :

```text
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)!
```

#### Générer le certificat

```bash
mkcert local.encvoy.com
```

Déplacer les certificats générés dans le dossier `certs/`.

### 12. Installer et démarrer nginx

#### macOS

Homebrew --- voir étape 11.

Installer nginx :

```bash
brew install nginx
```

Démarrer nginx :

```bash
npm run nginx:start
```

### 13. Démarrer l'application

```bash
npm run start
```
