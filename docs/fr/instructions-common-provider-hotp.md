---
title: "Connexion via HOTP — Connexion et configuration dans Encvoy ID"
description: "Apprenez à activer la connexion HOTP dans Encvoy ID : créez une méthode de connexion, ajoutez-la au widget d'autorisation et assurez un accès sécurisé pour les utilisateurs."
keywords:
  - connexion via HOTP
  - authentification HOTP
  - configuration HOTP
  - connexion HOTP
  - login HOTP
  - authentification à deux facteurs HOTP
  - HOTP Encvoy ID
  - connexion via HOTP Encvoy ID
  - configuration HOTP dans Encvoy ID
  - HOTP
  - HMAC-based One-Time Password
  - mot de passe à usage unique
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Connexion via HOTP"
---

# Comment connecter la connexion via HOTP dans Encvoy ID

> 📋 Cette instruction fait partie d'une série d'articles sur la configuration des méthodes de connexion. Pour plus de détails, lisez le guide [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md).

Dans ce guide, vous apprendrez comment connecter l'authentification par mot de passe à usage unique **HOTP** au système **Encvoy ID**.

À qui s'adresse ce guide :

- Administrateurs — pour configurer la méthode de connexion dans le système.
- Utilisateurs — pour lier **HOTP** à leur profil.

La configuration de la connexion via **HOTP** se compose de plusieurs étapes clés :

- [Configuration de l'authentification pour les administrateurs](#admin-authentication-setup)
- [Liaison HOTP pour les utilisateurs](#hotp-user-binding)

---

## Informations générales

**HOTP** (HMAC-based One-Time Password) est un algorithme de génération de mots de passe à usage unique basé sur une clé secrète et un compteur qui s'incrémente à chaque utilisation réussie du code. Il est largement utilisé pour l'authentification à deux facteurs, ajoutant une couche de sécurité supplémentaire au nom d'utilisateur et au mot de passe standard.

La principale différence entre **HOTP** et **TOTP** est que les codes ne dépendent pas du temps. Chaque utilisation d'un code incrémente le compteur, et le serveur vérifie le code saisi par rapport à la valeur actuelle du compteur.

> 💡 Pour créer une méthode de connexion basée sur **TOTP**, utilisez le guide [Comment connecter la connexion via TOTP](./instructions-common-provider-totp.md).

**Composants principaux :**

- **Serveur d'authentification** — le serveur qui génère la clé secrète et vérifie les codes saisis, en tenant compte du compteur.
- **Authentificateur** — une application qui stocke la clé secrète et le compteur actuel, générant des mots de passe à usage unique.
- **Clé secrète** — une base partagée entre le serveur et l'application utilisée pour générer les codes.

### Fonctionnement de HOTP

1. **Configuration préliminaire**
   - L'administrateur crée une méthode de connexion **HOTP** et l'active pour les widgets des applications requises.
   - L'utilisateur ajoute un nouvel identifiant **HOTP** dans son profil en scannant un code QR avec la clé secrète à l'aide d'une application d'authentification.

2. **Génération et vérification du code**
   - L'application d'authentification calcule un mot de passe à usage unique basé sur la clé secrète et la valeur actuelle du compteur en utilisant l'algorithme `SHA1`, `SHA256` ou `SHA512`.
   - Lorsque l'utilisateur saisit le code sur le formulaire de connexion, le serveur calcule le code attendu en utilisant le même secret et le compteur actuel.
   - Si le code correspond, le serveur incrémente le compteur et accorde l'accès à l'utilisateur.

> 🚨 **Important** : **HOTP** ne dépend pas du temps, la synchronisation de l'horloge n'est donc pas requise.

---

## Configuration de l'authentification pour les administrateurs { #admin-authentication-setup }

### Étape 1. Création d'une méthode de connexion

1. Allez dans le Panneau d'administration → onglet **Paramètres**.

   > 💡 Pour créer une méthode de connexion pour une organisation, ouvrez le **Tableau de bord de l'organisation**. Si la méthode de connexion est nécessaire pour une application spécifique, ouvrez les **paramètres de cette application**.

2. Trouvez le bloc **Méthodes de connexion** et cliquez sur **Configurer**.
3. Dans la fenêtre qui s'ouvre, cliquez sur le bouton **Créer** ![Bouton Créer](./images/button-create.webp "Bouton Créer").
4. Une fenêtre avec une liste de modèles s'ouvrira.
5. Sélectionnez le modèle **HOTP**.
6. Remplissez le formulaire de création :

   **Informations de base**
   - **Nom** — Le nom que les utilisateurs verront.
   - **Description** (facultatif) — Une brève description.
   - **Logo** (facultatif) — Vous pouvez télécharger votre propre icône, sinon celle par défaut sera utilisée.

   **Paramètres**
   - **Nombre de chiffres** — Le nombre de chiffres dans le mot de passe à usage unique (généralement 6).
   - **Valeur initiale du compteur** — Compteur actuel (non modifiable).
   - **Algorithme** — Algorithme de hachage (`SHA1`, `SHA256` ou `SHA512`) (généralement `SHA-1`).

   **Paramètres avancés**
   - **Méthode de connexion publique** — Activez cette option si vous souhaitez que cette méthode de connexion soit disponible pour être ajoutée à d'autres applications du système (ou de l'organisation), ainsi qu'au profil utilisateur en tant qu'[identifiant de service externe](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicité** — Définissez le niveau de publicité par défaut pour l'identifiant de service externe dans le profil utilisateur.

7. Cliquez sur **Créer**.

Après une création réussie, la nouvelle méthode de connexion apparaîtra dans la liste générale des fournisseurs.

### Étape 2. Ajout du fournisseur HOTP au Widget

Pour rendre le bouton **HOTP** visible pour les utilisateurs sur le formulaire d'autorisation, vous devez activer cette fonctionnalité dans les paramètres du widget :

1. Trouvez la méthode de connexion créée dans la liste générale des fournisseurs.
2. Basculez l'interrupteur sur le panneau du fournisseur.

> **Vérification** : Après avoir enregistré, ouvrez le formulaire de connexion dans une application de test. Un nouveau bouton avec le logo **HOTP** devrait apparaître sur le widget.

---

## Liaison HOTP pour les utilisateurs { #hotp-user-binding }

> 📌 Cette instruction est destinée aux utilisateurs qui ont besoin de se connecter au système via **HOTP**.

### Étape 1. Installation d'une application d'authentification

Vous devez installer une application sur votre appareil mobile qui génère des codes HOTP.

Les options les plus populaires sont :

- **Google Authenticator** (Google)

### Étape 2. Ajout d'un identifiant HOTP au profil

1. Allez dans votre **Profil**.
2. Cliquez sur **Ajouter** dans le bloc **Identifiants**.

<img src="./images/personal-profile-12.webp" alt="Bloc identifiant dans le profil utilisateur Encvoy ID" style="max-width:600px; width:100%">

3. Dans la fenêtre qui s'ouvre, sélectionnez la méthode de connexion **HOTP**.

4. Scannez le code QR à l'aide de l'application d'authentification.
5. Saisissez le code de l'application et confirmez.

> 💡 **Conseil** : Si l'identifiant est déjà lié à un autre utilisateur, vous devez le supprimer du profil de cet utilisateur avant de le lier au nouveau compte.

### Étape 3. Vérification

1. Allez sur la page de connexion où la méthode de connexion **HOTP** est activée.
2. Sélectionnez l'icône de la méthode de connexion **HOTP**.
3. Un formulaire de saisie du code s'ouvrira. Sans fermer la page, ouvrez l'application d'authentification sur votre téléphone.
4. Trouvez le service correspondant à **Encvoy ID** (ou le nom de l'application) et saisissez votre identifiant et le code à 6 chiffres dans le champ du formulaire de connexion.
5. Cliquez sur le bouton **Confirmer**.

---

## Voir aussi

- [Méthodes de connexion et configuration du widget de connexion](./docs-06-github-en-providers-settings.md) — un guide sur les méthodes de connexion et la configuration du widget de connexion.
- [Gestion de l'organisation](./docs-09-common-mini-widget-settings.md) — un guide pour travailler avec les organisations dans le système **Encvoy ID**.
- [Profil personnel et gestion des permissions d'application](./docs-12-common-personal-profile.md) — un guide pour gérer votre profil personnel.
