---
title: "Connexion WebAuthn — Se connecter dans Encvoy ID"
description: "Découvrez comment configurer la connexion WebAuthn dans Encvoy ID : créez une méthode de connexion et ajoutez-la au widget d'autorisation. Connectez-vous en quelques étapes seulement."
keywords:
  - connexion WebAuthn
  - authentification WebAuthn
  - connexion WebAuthn
  - configuration WebAuthn
  - WebAuthn Encvoy ID
  - connexion via WebAuthn Encvoy ID
  - configuration de WebAuthn dans Encvoy ID
author: "Équipe Encvoy ID"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Connexion via WebAuthn"
---

# Comment configurer la connexion WebAuthn dans Encvoy ID

> 📋 Cette instruction fait partie d'une série d'articles sur la configuration des méthodes de connexion. Pour plus de détails, consultez le guide [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md).

Dans ce guide, vous apprendrez comment connecter l'authentification **WebAuthn** au système **Encvoy ID**.

**Table des matières :**

- [Informations générales](#general-info)
- [Configuration de l'authentification WebAuthn pour les administrateurs](#webauthn-admin-setup)
- [Ajout d'une clé pour un utilisateur](#adding-key-for-user)
- [Voir aussi](#see-also)

---

## Informations générales { #general-info }

**WebAuthn** (Web Authentication) est un standard d'authentification qui permet aux utilisateurs de se connecter sans mot de passe en utilisant des méthodes de vérification sécurisées :

- biométrie (Face ID, Touch ID) ;
- clés de sécurité matérielles ;
- modules de sécurité intégrés aux appareils.

**WebAuthn** fait partie de la spécification **FIDO2** et est pris en charge par tous les navigateurs modernes.

> 🔐 **WebAuthn** peut être utilisé comme méthode de connexion principale ou comme facteur supplémentaire pour l'authentification multi-facteurs.

### Fonctionnement de WebAuthn

1. **Enregistrement de l'utilisateur :**
   - L'utilisateur crée une clé d'authentification.
   - L'appareil génère une paire de clés : la clé publique est stockée dans le système, tandis que la clé privée reste uniquement chez l'utilisateur.

2. **Initiation de la connexion :**
   - L'utilisateur sélectionne la méthode de connexion **WebAuthn** sur la ressource web.
   - Le serveur envoie un défi (`challenge`) pour vérifier l'identité.

3. **Authentification de l'utilisateur :**
   - L'appareil ou le jeton signe le `challenge` avec la clé privée.
   - Le serveur vérifie la signature à l'aide de la clé publique stockée.
   - Si la signature est valide, l'accès est accordé à l'utilisateur.

4. **Établissement d'un canal sécurisé :** Après une authentification réussie, l'utilisateur se connecte au système sans transmettre de mot de passe sur le réseau.

---

## Configuration de l'authentification WebAuthn pour les administrateurs { #webauthn-admin-setup }

### Étape 1. Création d'une méthode de connexion

1. Allez dans le Panneau d'administration → onglet **Paramètres**.

   > 💡 Pour créer une méthode de connexion pour une organisation, ouvrez le **Tableau de bord de l'organisation**. Si la méthode de connexion est nécessaire pour une application spécifique, ouvrez les **paramètres de cette application**.

2. Trouvez le bloc **Méthodes de connexion** et cliquez sur **Configurer**.
3. Dans la fenêtre qui s'ouvre, cliquez sur le bouton **Créer** ![Bouton Créer](./images/button-create.webp "Bouton Créer").
4. Une fenêtre avec une liste de modèles s'ouvrira.
5. Sélectionnez le modèle **WebAuthn**.
6. Remplissez le formulaire de création :

   **Informations de base**
   - **Nom** — Le nom que les utilisateurs verront.
   - **Description** (facultatif) — Une brève description.
   - **Logo** (facultatif) — Vous pouvez télécharger votre propre icône, sinon celle par défaut sera utilisée.

   **Paramètres supplémentaires**
   - **Méthode de connexion publique** — Activez cette option pour que la méthode de connexion puisse être ajoutée au profil utilisateur en tant qu'[identifiant de service externe](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicité** — Définissez le niveau de publicité par défaut pour l'identifiant de service externe dans le profil utilisateur.

7. Cliquez sur **Créer**.

Après une création réussie, la nouvelle méthode de connexion apparaîtra dans la liste générale des fournisseurs.

### Étape 2. Ajout du fournisseur WebAuthn au Widget

Pour rendre le bouton **WebAuthn** visible pour les utilisateurs sur le formulaire d'autorisation, vous devez activer cette fonctionnalité dans les paramètres du widget :

1. Trouvez la méthode de connexion créée dans la liste générale des fournisseurs.
2. Basculez l'interrupteur sur le panneau du fournisseur en position "On".

> **Vérification** : Après l'enregistrement, ouvrez le formulaire de connexion dans une application de test. Un nouveau bouton avec le logo **WebAuthn** devrait apparaître sur le widget.

---

## Ajout d'une clé pour un utilisateur { #adding-key-for-user }

### Étape 1. Ajout d'une clé à l'appareil

L'enregistrement d'une clé **WebAuthn** est le processus de création d'une paire de clés publique et privée et de sa liaison à un utilisateur spécifique.

Pour utiliser la connexion **WebAuthn**, l'utilisateur doit d'abord enregistrer une clé — il peut s'agir d'un authentificateur intégré (par exemple, **Touch ID**, **Face ID** ou **Windows Hello**) ou d'une clé de sécurité physique externe.

Pendant le processus d'ajout de clé, une paire cryptographique unique est créée — **clés publique** et **privée**.

- La clé privée est stockée de manière sécurisée sur l'appareil de l'utilisateur et n'est jamais transmise sur le réseau.
- La clé publique est stockée sur le serveur **Encvoy ID** et est utilisée pour la vérification ultérieure de l'authentification lors de la connexion.

Après avoir enregistré la clé, l'utilisateur doit ajouter l'identifiant **WebAuthn** à son profil **Encvoy ID**.

### Étape 2. Ajout de l'identifiant au profil

1. Allez dans votre **Profil**.
2. Cliquez sur **Ajouter** dans le bloc **Identifiants**.

<img src="./images/personal-profile-12.webp" alt="Bloc Identifiants dans le profil utilisateur" style="max-width:600px; width:100%">

3. Dans la fenêtre qui s'ouvre, sélectionnez la méthode de connexion **WebAuthn**.
4. Dans la boîte de dialogue du système, spécifiez la clé précédemment enregistrée.

> 💡 **Conseil** : Si l'identifiant est déjà lié à un autre utilisateur, il doit être supprimé du profil de cet utilisateur avant de pouvoir être lié au nouveau compte.

---

## Voir aussi { #see-also }

- [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md) — un guide sur les méthodes de connexion et la configuration du widget de connexion.
- [Gestion de l'organisation](./docs-09-common-mini-widget-settings.md) — un guide sur le travail avec les organisations dans le système **Encvoy ID**.
- [Profil personnel et gestion des permissions d'application](./docs-12-common-personal-profile.md) — un guide pour gérer votre profil personnel.
