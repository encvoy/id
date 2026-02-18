---
title: "Connexion par e-mail dans Encvoy ID — Configuration de l'e-mail"
description: "Découvrez comment activer la connexion par e-mail dans Encvoy ID : créez une méthode de connexion et ajoutez-la au widget d'autorisation. Connectez-vous en quelques étapes seulement."
keywords:
  - connexion par e-mail dans Encvoy ID
  - configuration e-mail
  - authentification par e-mail
  - connecter e-mail
  - Connexion e-mail Encvoy ID
  - OAuth e-mail Encvoy ID
author: Équipe Encvoy ID
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Connexion via E-mail"
---

# Comment connecter la connexion par e-mail dans Encvoy ID

> 📋 Cette instruction fait partie d'une série d'articles sur la configuration des méthodes de connexion. Pour plus de détails, lisez le guide [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md).

Dans ce guide, vous apprendrez comment activer l'authentification par e-mail dans votre organisation ou application. La méthode de connexion par e-mail sera utilisée pour envoyer des notifications par e-mail, telles que les e-mails d'inscription, la récupération de mot de passe et d'autres événements.

La configuration de la connexion via **E-mail** se compose de plusieurs étapes :

- [Étape 1. Création d'une méthode de connexion](#step-1-create-login-method)
- [Étape 2. Ajout au widget](#step-2-add-to-widget)

---

## Étape 1. Création d'une méthode de connexion { #step-1-create-login-method }

1. Allez dans le Panneau d'administration → onglet **Paramètres**.

   > 💡 Pour créer une méthode de connexion pour une organisation, ouvrez le **Tableau de bord de l'organisation**. Si la méthode de connexion est nécessaire pour une application spécifique, ouvrez **les paramètres de cette application**.

2. Trouvez le bloc **Méthodes de connexion** et cliquez sur **Configurer**.
3. Dans la fenêtre qui s'ouvre, cliquez sur le bouton **Créer** ![Bouton Créer](./images/button-create.webp "Bouton Créer").
4. Une fenêtre avec une liste de modèles s'ouvrira.
5. Sélectionnez le modèle **Email**.
6. Remplissez le formulaire de création :

   **Informations de base**
   - **Nom** — Le nom que les utilisateurs verront.
   - **Description** (facultatif) — Une brève description.
   - **Logo** (facultatif) — Vous pouvez télécharger votre propre icône, sinon l'icône standard sera utilisée.

   **Paramètres**
   - **Adresse e-mail principale** — L'adresse e-mail principale qui sera utilisée pour l'envoi des e-mails.
   - **Adresse du serveur de courrier sortant** — L'adresse du serveur de courrier sortant.
   - **Port du serveur de courrier sortant** — Le port du serveur de courrier sortant.
   - **Mot de passe de messagerie** — Un mot de passe standard ou un mot de passe d'application créé dans les paramètres du compte de service de messagerie.
   - **Durée de vie du code de confirmation** — La durée de vie du code de confirmation pour le service de messagerie en secondes.

   **Paramètres supplémentaires**
   - **Méthode de connexion publique** — Activez cette option si vous souhaitez que cette méthode de connexion soit disponible pour être ajoutée à d'autres applications du système (ou de l'organisation), ainsi qu'au profil utilisateur en tant qu'[identifiant de service externe](./docs-12-common-personal-profile.md#external-service-identifiers).

7. Cliquez sur **Créer**.

Après une création réussie, la nouvelle méthode de connexion apparaîtra dans la liste générale des fournisseurs.

---

## Étape 2. Ajout au widget { #step-2-add-to-widget }

Pour rendre le bouton **Connexion via E-mail** visible pour les utilisateurs sur le formulaire d'autorisation, vous devez activer cette fonctionnalité dans les paramètres du widget :

1. Trouvez la méthode de connexion créée dans la liste générale des fournisseurs.
2. Activez le commutateur sur le panneau du fournisseur.

> **Vérification** : Après l'enregistrement, ouvrez le formulaire de connexion dans une application de test. Un nouveau bouton avec le logo **Email** devrait apparaître sur le widget.

---

## Voir aussi

- [Méthodes de connexion et configuration du widget de connexion](./docs-06-github-en-providers-settings.md) — un guide sur les méthodes de connexion et la configuration du widget de connexion.
- [Gestion de l'organisation](./docs-09-common-mini-widget-settings.md) — un guide sur le travail avec les organisations dans le système **Encvoy ID**.
- [Profil personnel et gestion des permissions d'application](./docs-12-common-personal-profile.md) — un guide sur la gestion du profil personnel.
