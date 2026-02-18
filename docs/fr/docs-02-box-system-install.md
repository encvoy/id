---
title: "Installation de Encvoy ID via Docker — Déploiement SSO"
description: "Installer Encvoy ID via Docker : prérequis, configuration et première connexion. Déploiement SSO étape par étape pour les administrateurs et DevOps."
keywords:
  - installer Encvoy ID
  - installation Encvoy ID
  - déploiement système SSO
  - déployer Encvoy ID
  - installation docker Encvoy ID
  - docker compose Encvoy ID
  - système SSO entreprise
author: "Équipe Encvoy ID"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Installation et premier lancement"
order: 2
---

# Comment installer Encvoy ID

Dans ce guide, vous apprendrez comment installer le système SSO **Encvoy ID** via Docker sur votre serveur. Nous parcourrons l'ensemble du processus — de la préparation de l'environnement à la première connexion de l'administrateur.

**Sommaire :**

- [Prérequis à l'installation](#installation-requirements)
- [Installation de Docker et Docker Compose](#install-docker-and-docker-compose)
- [Installation du système SSO](#install-sso-system)
- [Première connexion](#first-login)
- [Voir aussi](#see-also)

---

## Prérequis à l'installation { #installation-requirements }

### Configuration système du serveur

Avant d'installer le système **Encvoy ID**, assurez-vous que votre infrastructure répond aux exigences.

Les besoins système dépendent de la charge prévue. Une configuration minimale suffit pour les environnements de test, tandis que les paramètres recommandés doivent être utilisés pour les environnements de production.

#### Configuration minimale

| Composant            | Exigences      |
| -------------------- | -------------- |
| **RAM**              | 4 Go           |
| **Espace disque**    | 50 Go SSD      |
| **Processeur (CPU)** | 2 cœurs x86_64 |
| **Interface réseau** | 1 Gbps         |

#### Configuration recommandée

| Composant            | Exigences       |
| -------------------- | --------------- |
| **RAM**              | 8 Go ou plus    |
| **Espace disque**    | 100 Go SSD/NVMe |
| **Processeur (CPU)** | 4+ cœurs x86_64 |
| **Interface réseau** | 1 Gbps et plus  |

> 💡 **Conseil :** Pour les systèmes à haute charge avec des milliers d'utilisateurs, il est recommandé d'utiliser : <br>
>
> - 16+ Go de RAM<br>
> - 8+ cœurs CPU<br>
> - Disques NVMe pour une performance maximale de la base de données

### Prérequis logiciels

#### Logiciels

| Composant                  | Versions supportées                                                                             | Informations complémentaires               |
| -------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Système d'exploitation** | Ubuntu 18.04 LTS (Bionic Beaver), <br> Ubuntu 20.04 LTS (Focal Fossa),<br> Debian 11 (Bullseye) | Toute distribution Linux supportant Docker |
| **Docker Engine**          | 19.03+                                                                                          | -                                          |
| **Docker Compose**         | 1.27+                                                                                           | -                                          |
| **Nginx/Apache**           | Toute version moderne                                                                           | -                                          |

#### Exigences générales

Pour une installation réussie et un fonctionnement correct de **Encvoy ID**, plusieurs conditions doivent être remplies :

- Un serveur avec une adresse IP statique.
- Accès à tous les postes de travail via le port qui sera utilisé pour accéder au système.
- Disponibilité d'un serveur de messagerie (serveur SMTP).
- La connexion au service doit être établie via le protocole HTTPS.

---

## Installation de Docker et Docker Compose { #install-docker-and-docker-compose }

**Encvoy ID** est déployé sous forme d'un ensemble de conteneurs Docker et peut être utilisé comme serveur d'autorisation OAuth 2.0 d'entreprise et fournisseur OpenID Connect (IdP).

> 📚 [Documentation Docker](https://docs.docker.com/engine/install/)

### Étape 1. Installation de Docker Engine

**Pour Ubuntu/Debian :**

```bash
# Mettre à jour les paquets
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Ajouter la clé GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le dépôt
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Vérifier l'installation
sudo docker --version
```

**Pour CentOS/RHEL :**

```bash
# Installer yum-utils
sudo yum install -y yum-utils

# Ajouter le dépôt Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Installer Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Démarrer et activer Docker
sudo systemctl start docker
sudo systemctl enable docker

# Vérifier l'installation
sudo docker --version
```

### Étape 2. Installation de Docker Compose

```bash
# Télécharger Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Définir les permissions d'exécution
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker-compose --version
```

> 💡 Versions requises : **Docker Engine 20.10+** et **Docker Compose 1.29+**. Utilisez `docker --version` et `docker-compose --version` pour vérifier.

---

## Installation du système SSO { #install-sso-system }

### Étape 1. Préparation du répertoire de travail

Créez et accédez au répertoire d'installation :

```bash
# Créer le répertoire
mkdir trusted-id && cd trusted-id

# Vérifier le chemin actuel
pwd  # Devrait afficher : /home/votre_utilisateur/trusted-id
```

### Étape 2. Téléchargement des fichiers de configuration

Téléchargez les fichiers de configuration nécessaires :

```bash
# Télécharger les fichiers principaux
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/docker-compose.yaml
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/nginx.conf
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/build.sh
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/.env

# Vérifier le téléchargement
ls -la
```

**Fichiers téléchargés :**

| Fichier                 | Usage                               |
| ----------------------- | ----------------------------------- |
| **docker-compose.yaml** | Configuration des conteneurs Docker |
| **nginx.conf**          | Paramètres du serveur web Nginx     |
| **build.sh**            | Script d'installation et de build   |
| **.env**                | Variables d'environnement           |

### Étape 3. Définition des permissions

Rendez le script de build exécutable :

```bash
# Définir les permissions pour le script de build
chmod +x ./build.sh

# Vérifier les permissions
ls -l build.sh
```

> ⚙️ Après l'installation, il est recommandé d'effectuer une configuration de base. Une description détaillée de tous les paramètres est disponible dans la section [Variables d'environnement Encvoy ID](./docs-03-box-system-configuration.md).

### Étape 4. Configuration des paramètres

Modifiez le fichier `.env` avec les paramètres principaux :

```bash
# Ouvrir le fichier pour modification (utilisez nano ou vim)
nano .env
```

**Paramètres requis :**

```env
# Domaine principal du système
ID_HOST=id.example.com  # Remplacez par votre domaine ou IP

# Email de l'administrateur
ADMIN_MAIL=exemple@mail.com  # Remplacez par un email réel
```

### Étape 5. Exécution du script de build

Lancez le script de configuration :

```bash
./build.sh
```

En conséquence, la valeur de la variable **ID_HOST** sera écrite dans le fichier **nginx.conf**, et les variables **CLIENT_ID** et **CLIENT_SECRET** seront écrites dans le fichier **.env**.

### Étape 6. Démarrage du système

Lancez le projet :

```bash
docker compose up -d
```

### Commandes Docker Compose utiles

| Commande          | Description                       | Exemple d'utilisation    |
| ----------------- | --------------------------------- | ------------------------ |
| **Voir les logs** | Surveiller les logs en temps réel | `docker compose logs -f` |
| **Arrêter**       | Arrêter tous les conteneurs       | `docker compose stop`    |
| **Démarrer**      | Démarrer les conteneurs arrêtés   | `docker compose start`   |
| **Redémarrer**    | Redémarrer tous les conteneurs    | `docker compose restart` |
| **Statut**        | Voir l'état des conteneurs        | `docker compose ps`      |

---

## Première connexion { #first-login }

### Identifiants administrateur par défaut

Après l'installation, un compte administratif avec les droits **Administrateur** est créé :

- **Identifiant** — `root`,
- **Mot de passe** — `changethis`,
- **Rôle** — **Administrateur**.

> 📌 Ces identifiants fournissent un accès complet au système. Assurez-vous de changer le mot de passe immédiatement après la première connexion.

### Première connexion

Pour accéder à l'interface web de **Encvoy ID**, rendez-vous sur : `https://ID_HOST`.

1. À la première étape du widget de connexion, saisissez l'identifiant et cliquez sur **Se connecter**.
2. Saisissez le mot de passe à la deuxième étape et cliquez sur **Se connecter**.

Après l'autorisation, vous serez redirigé vers le [Profil](./docs-12-common-personal-profile.md) de l'utilisateur.

### Accès au panneau d'administration { #admin-panel-access }

Les paramètres d'administration se trouvent dans le panneau d'administration.

Pour accéder au panneau :

1. Cliquez sur votre nom dans le coin supérieur droit de la fenêtre.
2. Dans le mini-widget qui s'ouvre, cliquez sur le nom du service **Encvoy ID**.
3. Vous serez redirigé vers le **Panneau d'administration**.

---

## Voir aussi { #see-also }

- [Description du système Encvoy ID](./docs-01-box-about.md) — aperçu des fonctionnalités de **Encvoy ID**.
- [Variables d'environnement Encvoy ID](./docs-03-box-system-configuration.md) — guide pour préparer la configuration avant le lancement.
- [Configuration du système](./docs-04-box-system-settings.md) — guide pour configurer l'interface et l'accès des utilisateurs au système.
