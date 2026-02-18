---
title: "Variables d'environnement Encvoy ID — Référence Administrateur"
description: "Apprenez à configurer correctement les variables d'environnement de Encvoy ID et à assurer le fonctionnement sécurisé du système. Un guide étape par étape pour les administrateurs."
keywords:
  - variables d'environnement Encvoy ID
  - configurer env Encvoy ID
  - variables env OIDC
  - variables d'environnement OpenID Connect
  - configuration environnement OAuth 2.0
  - docker-compose env
  - configuration PostgreSQL Encvoy ID
  - configuration SMTP Encvoy ID
  - personnalisation interface Encvoy ID
  - CUSTOM_STYLES Encvoy ID
  - sécurité des variables d'environnement
  - administrateur Encvoy ID
  - configuration serveur Encvoy ID
  - guide de configuration Encvoy ID
  - métriques Google Encvoy ID
author: "Équipe Encvoy ID"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Configuration des variables d'environnement"
order: 3
---

# Comment configurer les variables d'environnement de Encvoy ID

Dans ce guide, vous apprendrez à configurer les variables d'environnement pour **Encvoy ID** sur votre serveur. Nous détaillerons tous les paramètres — de la base de données et l'OIDC au cache, au courrier électronique et à l'interface — pour garantir que votre système fonctionne correctement dès le premier lancement.

**Table des matières :**

- [Comment configurer les variables d'environnement de Encvoy ID](#comment-configurer-les-variables-denvironnement-de-encvoy-id)
  - [Variables d'environnement communes { #common-environment-variables }](#variables-denvironnement-communes--common-environment-variables-)
  - [Variables d'environnement de la base de données (PostgreSQL) { #database-environment-variables }](#variables-denvironnement-de-la-base-de-données-postgresql--database-environment-variables-)
  - [Redis, Sessions et Cookies OIDC { #redis-sessions-and-oidc-cookies }](#redis-sessions-et-cookies-oidc--redis-sessions-and-oidc-cookies-)
  - [Limitation de débit et Journalisation { #rate-limiting-and-logging }](#limitation-de-débit-et-journalisation--rate-limiting-and-logging-)
  - [Courrier et Notifications { #mail-and-notifications }](#courrier-et-notifications--mail-and-notifications-)
  - [Personnalisation de l'interface { #interface-customization }](#personnalisation-de-linterface--interface-customization-)
  - [Permissions et Licences { #permissions-and-licenses }](#permissions-et-licences--permissions-and-licenses-)
  - [Métriques { #metrics }](#métriques--metrics-)
  - [Voir aussi { #see-also }](#voir-aussi--see-also-)

> 💡 Pour modifier les variables d'environnement, vous devez apporter des modifications au fichier **docker-compose.yml**.

---

## Variables d'environnement communes { #common-environment-variables }

Ces variables définissent le comportement de base et l'identification du service.

| Variable                    | Description                                                                | Valeur par défaut             |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------- |
| `NODE_ENV`                  | Environnement d'exécution de l'application (`development` ou `production`) | `production`                  |
| `DOMAIN`                    | Domaine du service                                                         | —                             |
| `ADMIN_LOGIN`               | Identifiant de l'administrateur                                            | `root`                        |
| `ADMIN_PASSWORD`            | Mot de passe de l'administrateur                                           | `changethis`                  |
| `DELETE_PROFILE_AFTER_DAYS` | Nombre de jours après lesquels un profil utilisateur sera supprimé         | `30`                          |
| `CLIENT_ID`                 | Identifiant unique de l'application (UUID recommandé)                      | —                             |
| `CLIENT_SECRET`             | Secret unique de l'application (UUID recommandé)                           | —                             |
| `MANUAL_URL`                | Lien vers la documentation pour les utilisateurs                           | `https://votre-domaine/docs/` |

> ⚠️ Les variables `CLIENT_ID` et `CLIENT_SECRET` sont utilisées pour identifier **Encvoy ID** en tant que client OAuth 2.0 / OpenID Connect et doivent rester secrètes.

---

## Variables d'environnement de la base de données (PostgreSQL) { #database-environment-variables }

Paramètres de connexion à la base de données PostgreSQL.

| Variable            | Description                                       | Valeur par défaut |
| ------------------- | ------------------------------------------------- | ----------------- |
| `POSTGRES_USER`     | Nom d'utilisateur pour la connexion PostgreSQL    | `user`            |
| `POSTGRES_PASSWORD` | Mot de passe de l'utilisateur PostgreSQL          | `password`        |
| `POSTGRES_DB`       | Nom de la base de données                         | `mydb`            |
| `POSTGRES_HOST`     | Hôte de la base de données                        | `localhost`       |
| `POSTGRES_PORT`     | Port de connexion à la base de données            | `5432`            |
| `DATABASE_URL`      | Chaîne de connexion complète au format PostgreSQL | —                 |

---

## Redis, Sessions et Cookies OIDC { #redis-sessions-and-oidc-cookies }

Paramètres pour le stockage des sessions, la mise en cache des données et la sécurité de l'authentification.

| Variable             | Description                                             | Valeur par défaut   |
| -------------------- | ------------------------------------------------------- | ------------------- |
| `REDIS_HOST`         | Hôte Redis                                              | `127.0.0.1`         |
| `REDIS_PORT`         | Port Redis                                              | `6379`              |
| `OIDC_COOKIE_SECRET` | Secret pour la signature et la vérification des cookies | —                   |
| `OIDC_SESSION_TTL`   | Durée de vie de la session en secondes                  | `86400` (24 heures) |

---

## Limitation de débit et Journalisation { #rate-limiting-and-logging }

Paramètres de protection contre les abus et contrôle de la journalisation.

| Variable             | Description                                    | Valeur par défaut |
| -------------------- | ---------------------------------------------- | ----------------- |
| `RATE_LIMIT`         | Nombre de requêtes pour la limitation de débit | `15`              |
| `RATE_LIMIT_TTL_SEC` | Période de temps en secondes pour la limite    | `900`             |
| `CONSOLE_LOG_LEVELS` | Niveaux de journalisation pour la console      | `log warn error`  |

---

## Courrier et Notifications { #mail-and-notifications }

Paramètres du serveur SMTP pour l'envoi d'e-mails (confirmation d'inscription, réinitialisation de mot de passe, etc.).

| Variable         | Description                                            | Valeur par défaut | Exemple                                                                                              |
| ---------------- | ------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER` | Paramètres du fournisseur de messagerie au format JSON | —                 | `{"hostname":"smtp.example.com","port":465,"root_mail":"admin@example.com","password":"SecretPass"}` |

---

## Personnalisation de l'interface { #interface-customization }

L'apparence des boutons, des liens et des onglets est configurée via un objet JSON dans la variable `CUSTOM_STYLES`.

La variable `CUSTOM_STYLES` vous permet de personnaliser l'interface de **Encvoy ID** sans modifier le code.

```env
# Aller dans le dossier du projet
cd /home/els/nodetrustedserverconfig

# Arrêter le service avant d'effectuer des modifications
docker compose stop

# Modifier le fichier .env
nano .env

# Exemple de personnalisation minimale
CUSTOM_STYLES=`{"palette":{"white":{"accent":"#2c5aa0","accentHover":"#1e3a6f"}},"button":{"borderRadius":"8px"}}`

# Redémarrer le service
docker compose up -d
```

Description de la variable `CUSTOM_STYLES` :

| Variable        | Description                                                                                                                                                      | Exemple                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOM_STYLES` | Paramètres d'apparence de l'interface, incluant les couleurs, les styles de boutons et les widgets. La valeur doit être strictement un JSON sur une seule ligne. | `CUSTOM_STYLES={"palette":{"white":{"accent":"#ff6f00","accentHover":"#f56b00","onAccentColor":"#fff"}},"button":{"borderRadius":"4px"},"widget":{"backgroundColor":"#ff6f00","color":"#fff","isHideText":false,"button":{"background":"#ffffff","hover":"#fadfcd","color":"#ff6f00"}},"isAccordionIconColored":true,"contentPosition":"center"}` |

| Paramètre                | Description                                                       | Exemple                        |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------ |
| `accent`                 | Couleur principale pour les éléments d'accentuation au format HEX | `"#ff6f00"`                    |
| `accentHover`            | Couleur au survol au format HEX                                   | `"#f56b00"`                    |
| `onAccentColor`          | Couleur du texte sur fond d'accentuation au format HEX            | `"#fff"`                       |
| `secondaryAccent`        | Couleur pour les éléments secondaires au format HEX               | `"#fae9de"`                    |
| `borderColor`            | Couleur de bordure pour les éléments au format HEX                | `"#858BA0"`                    |
| `borderRadius`           | Arrondi des angles pour les boutons (`button`)                    | `4px`, `8px`, etc.             |
| `isAccordionIconColored` | Colorer les icônes d'accordéon                                    | `true`/`false`                 |
| `contentPosition`        | Alignement du contenu                                             | `"start"`, `"center"`, `"end"` |

---

## Permissions et Licences { #permissions-and-licenses }

| Variable    | Description                              | Valeur par défaut     | Exemple                                |
| ----------- | ---------------------------------------- | --------------------- | -------------------------------------- |
| `COPYRIGHT` | Informations de copyright au format JSON | `{"ru":" ","en":" "}` | `{"ru":"© Компания","en":"© Company"}` |

---

## Métriques { #metrics }

| Variable            | Description                            |
| ------------------- | -------------------------------------- |
| `GOOGLE_METRICA_ID` | ID pour l'intégration Google Analytics |

---

## Voir aussi { #see-also }

- [Installation du système Encvoy ID](./docs-02-box-system-install.md) — guide pour l'installation du système.
- [Configuration du système](./docs-04-box-system-settings.md) — guide pour configurer l'interface et l'accès des utilisateurs au système.
