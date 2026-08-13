---
title: "Connexion OpenID Connect — Connexion dans {{projectName}}"
description: "Apprenez à activer la connexion OpenID Connect dans {{projectName}} : créez une méthode de connexion et ajoutez-la au widget d'autorisation. Connectez-vous en quelques étapes seulement."
keywords: 
  - connexion OpenID Connect
  - OpenID Connect
  - OIDC
  - oidc
  - configuration OpenID Connect
  - connexion OpenID Connect
  - autorisation OpenID Connect
  - OpenID Connect {{projectName}}
  - configurer OpenID Connect dans {{projectName}}
  - connecter OpenID Connect à {{projectName}}
author: "Équipe {{projectName}}"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Connexion OIDC"
---

# Comment connecter la connexion OpenID Connect dans {{projectName}}

> 📋 Cette instruction fait partie d'une série d'articles sur la configuration des méthodes de connexion. Pour plus de détails, lisez le guide [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md).

Dans ce guide, vous apprendrez comment connecter l'authentification **OpenID Connect** au système **{{projectName}}**.

La configuration de la connexion via **OpenID Connect** se compose de trois étapes clés effectuées dans deux systèmes différents :

- [Étape 1. Configuration du côté du système externe](#step-1-configure-external-system)
- [Étape 2. Création d'une méthode de connexion](#step-2-create-login-method)
- [Étape 3. Ajout au widget](#step-3-add-to-widget)
- [Description des paramètres](#parameters-description)
- [Voir aussi](#see-also)

---

## Étape 1. Configuration du côté du système externe { #step-1-configure-external-system }

1. Créez une application dans le service d'identité externe.  
2. Copiez les valeurs des champs **ID de l'application/Client ID** et **Secret/Client Secret**. Vous en aurez besoin lors de la création de l'application dans **{{projectName}}**.

---

## Étape 2. Création d'une méthode de connexion { #step-2-create-login-method }

1. Allez dans le Panneau d'administration → onglet **Paramètres**.

    > 💡 Pour créer une méthode de connexion pour une organisation, ouvrez le **Tableau de bord de l'organisation**. Si la méthode de connexion est nécessaire pour une application spécifique, ouvrez **les paramètres de cette application**.

2. Trouvez le bloc **Méthodes de connexion** et cliquez sur **Configurer**.
3. Dans la fenêtre qui s'ouvre, cliquez sur le bouton **Créer** ![Bouton Créer](./images/button-create.webp "Bouton Créer").
4. Une fenêtre avec une liste de modèles s'ouvrira.
5. Sélectionnez le modèle **OpenID Connect**.
6. Remplissez le formulaire de création :

    **Informations de base**

    - **Nom** — Le nom que les utilisateurs verront.
    - **Description** (facultatif) — Une brève description.
    - **Logo** (facultatif) — Vous pouvez télécharger votre propre icône, sinon l'icône par défaut sera utilisée.

    **Paramètres d'authentification**

    - **Identifiant client (client_id)** — Collez l'**ID de l'application** (`Client ID`) copié.
    - **Secret client (client_secret)** — Collez le **Secret** (`Client Secret`) copié.
    - **URL de redirection (Redirect URI)** — Ce champ sera rempli automatiquement en fonction de votre domaine.
    - **Adresse de base du serveur d'autorisation (issuer)** — L'adresse du service d'identité externe.
    - **Point de terminaison d'autorisation (authorization_endpoint)** — L'adresse vers laquelle l'utilisateur est redirigé pour l'autorisation.
    - **Point de terminaison de jeton (token_endpoint)** — La ressource qui assure l'émission des jetons.
    - **Point de terminaison d'informations utilisateur (userinfo_endpoint)** — La ressource qui renvoie les informations sur l'utilisateur actuel.
    - **Autorisations demandées (scopes)** — Une liste de permissions à demander au fournisseur d'identité. Pour ajouter une permission, tapez son nom et appuyez sur **Entrée**.

    **Paramètres supplémentaires**

    - **Méthode de connexion publique** — Activez cette option si vous souhaitez que cette méthode de connexion puisse être ajoutée à d'autres applications du système (ou de l'organisation), ainsi qu'au profil utilisateur en tant qu'[identifiant de service externe](./docs-12-common-personal-profile.md#external-service-identifiers).
    - **Publicité** — Définissez le niveau de publicité par défaut pour l'identifiant de service externe dans le profil utilisateur.

7. Cliquez sur **Créer**.

Après une création réussie, la nouvelle méthode de connexion apparaîtra dans la liste générale des fournisseurs.

---

## Étape 3. Ajout au widget { #step-3-add-to-widget }

Pour rendre le bouton **Se connecter avec OpenID Connect** visible sur le formulaire d'autorisation, vous devez activer cette fonctionnalité dans les paramètres du widget :

1. Trouvez la méthode de connexion créée dans la liste générale des fournisseurs.
2. Activez le commutateur sur le panneau du fournisseur.

> **Vérification** : Après avoir enregistré, ouvrez le formulaire de connexion dans une application de test. Un nouveau bouton avec le logo **OpenID Connect** devrait apparaître sur le widget.

---

## Description des paramètres { #parameters-description }

### Informations de base

| Nom | Description | Type | Limites |
|---|---|---|---|
| **Nom** | Le nom qui sera affiché dans l'interface du service **{{projectName}}** | Texte | Max 50 caractères |
| **Description** | Une brève description qui sera affichée dans l'interface du service **{{projectName}}** | Texte | Max 255 caractères |
| **Logo** | L'image qui sera affichée dans l'interface du service **{{projectName}}** et le widget de connexion | JPG, GIF, PNG, ou WEBP | Taille max : 1 Mo |

### Paramètres d'authentification

| Nom | Paramètre | Description |
|---|---|---|
| **Identifiant client (client_id)** | `client_id` | ID de l'application créée dans le système externe |
| **Secret client (client_secret)** | `client_secret` | Clé d'accès au service de l'application créée du côté du système externe |
| **URL de redirection (Redirect URI)** (non modifiable) | `redirect URI` | L'adresse **{{projectName}}** vers laquelle l'utilisateur est redirigé après l'authentification dans le service tiers |
| **Adresse de base du serveur d'autorisation (issuer)** | `issuer` | L'adresse du service d'identité externe |
| **Point de terminaison d'autorisation (authorization_endpoint)** | `authorization_endpoint` | L'adresse vers laquelle l'utilisateur est redirigé pour l'autorisation |
| **Point de terminaison de jeton (token_endpoint)** | `token_endpoint` | La ressource qui assure l'émission des jetons |
| **Point de terminaison d'informations utilisateur (userinfo_endpoint)** | `userinfo_endpoint` | La ressource qui renvoie les informations sur l'utilisateur actuel |
| **Autorisations demandées (scopes)** | - | Une liste de permissions à demander au fournisseur d'identité. Pour ajouter une permission, tapez son nom et appuyez sur **Entrée**. |

### Paramètres supplémentaires

| Nom | Description |
|---|---|
| **Méthode de connexion publique**| Lorsqu'activé : <br> - La méthode de connexion devient disponible pour être ajoutée à d'autres applications de service. <br> - La méthode de connexion devient disponible pour être ajoutée en tant qu'[identifiant de service externe](./docs-12-common-personal-profile.md#external-service-identifiers) dans le profil utilisateur. |
| **Publicité** | Définit le niveau de publicité par défaut pour l'identifiant de service externe dans le profil utilisateur |

---

## Voir aussi { #see-also }

- [Méthodes de connexion et configuration du widget de connexion](./docs-06-github-en-providers-settings.md) — guide sur les méthodes de connexion et la configuration du widget de connexion.
- [Gestion de l'organisation](./docs-09-common-mini-widget-settings.md) — guide sur le travail avec les organisations dans le système **{{projectName}}**.
- [Profil personnel et gestion des permissions d'application](./docs-12-common-personal-profile.md) — guide sur la gestion du profil personnel.