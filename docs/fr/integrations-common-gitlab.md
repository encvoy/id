---
title: "Intégration de GitLab avec {{projectName}} — configuration de l'authentification unique"
description: "Découvrez comment configurer l'authentification unique pour GitLab via {{projectName}} : configuration simple, protection des données et accès pratique pour tous les employés de l'entreprise."
keywords:
  - Intégration GitLab avec {{projectName}}
  - GitLab {{projectName}}
  - SSO GitLab
  - Authentification unique GitLab
  - Connexion SSO à GitLab
  - Single sign-on dans GitLab
  - Authentification GitLab
  - Autorisation GitLab
  - Authentification OAuth GitLab
  - Connexion à GitLab via {{projectName}}
  - Configuration de GitLab avec {{projectName}}
  - Connexion de GitLab à {{projectName}}
  - Authentification unique dans gitlab
author: "L'équipe {{projectName}}"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Intégration avec GitLab"
---

# Comment configurer l'intégration de GitLab avec {{projectName}}

Dans ce guide, vous apprendrez comment configurer l'authentification unique (SSO) dans **GitLab** via le système **{{projectName}}**.

> 📌 [GitLab](https://about.gitlab.com/) est une plateforme web de gestion de projets et de dépôts de code logiciel, basée sur le système de contrôle de version populaire **Git**.

La configuration de la connexion via **{{projectName}}** se compose de plusieurs étapes clés réalisées dans deux systèmes différents.

- [Étape 1. Créer l'application](#step-1-create-application)
- [Étape 2. Configurer le système GitLab](#step-2-configure-gitlab)
- [Étape 3. Vérifier l'intégration](#step-3-verify-integration)

---

## Étape 1. Créer l'application { #step-1-create-application }

1. Connectez-vous au système **{{projectName}}**.  
2. Créez une application avec les paramètres suivants :

   - **Adresse de l'application** - l'adresse de votre installation **GitLab** ;  
   - **URL de redirection \#1 (`Redirect_uri`)** - `<Adresse de l'installation GitLab>/users/auth/oauth2_generic/callback`.  

    > 🔍 Pour plus de détails sur la création d'applications, lisez les [instructions](./docs-10-common-app-settings.md#creating-application).

3. Ouvrez les [paramètres de l'application](./docs-10-common-app-settings.md#editing-application) et copiez les valeurs des champs suivants :

    - **Identifiant** (`Client_id`),
    - **Clé secrète** (`client_secret`).

---

## Étape 2. Configurer le système GitLab { #step-2-configure-gitlab }

La configuration de l'autorisation des utilisateurs pour le service **GitLab** via **{{projectName}}** s'effectue dans le fichier de configuration **GitLab gitlab.rb**, situé dans le dossier de configuration du service (/config).  

1. Ouvrez le fichier de configuration **gitlab.rb** en mode édition et accédez au bloc **OmniAuth Settings**.  
2. Définissez les valeurs suivantes pour les paramètres :  

    ```bash
        gitlab_rails['omniauth_enabled'] = true  
        gitlab_rails['omniauth_allow_single_sign_on'] = ['oauth2_generic', '<{{projectName}}SystemName>']  
        gitlab_rails['omniauth_block_auto_created_users'] = false  

        La valeur pour gitlab_rails['omniauth_providers'] doit ressembler à ceci :  

        gitlab_rails['omniauth_providers'] = [  
        {  
        'name' => 'oauth2_generic',   
        'app_id' => '<Client_id de l'application créée dans {{projectName}}>',  
        'app_secret' => '<Client_secret de l'application créée dans {{projectName}}>',  
        'args' => {  
        client_options: {  
        'site' => 'https://<adresse du système {{projectName}}>/',  
        'authorize_url' => '/api/oidc/auth',  
        'user_info_url' => '/api/oidc/me',  
        'token_url' => '/api/oidc/token'  
        },  
        user_response_structure: {  
        root_path: [],  
        id_path: ['sub'],  
        attributes: { email:'email',  name:'nickname' },  
        },  
        scope: 'openid profile email',  
        'name' => '<{{projectName}}SystemName>’  
        }  
        }  
        ]  
    ```

    <img src="./images/integrations-gitlab-01.webp" alt="Configuration du fichier GitLab" style="max-width:600px; width:100%">

3. Redémarrez le service **GitLab** pour appliquer les nouveaux paramètres.
4. Si nécessaire, connectez-vous en tant qu'administrateur à l'interface du service **GitLab**. Accédez au chemin des paramètres **Admin (Admin Area) — Settings-General**.  

    Sur la page qui s'ouvre, dans le bloc **Sign-in restrictions**, cochez la case à côté de <{{projectName}}SystemName> dans le sous-bloc **Enabled OAuth authentication sources**.  

    <img src="./images/integrations-gitlab-02.webp" alt="Configuration du panneau d'administration GitLab" width="80%">

---

## Étape 3. Vérifier l'intégration { #step-3-verify-integration }

1. Ouvrez la page de connexion de **GitLab**.
2. Vérifiez que le bouton **Connexion via {{projectName}}** est apparu.
3. Cliquez sur le bouton et connectez-vous en utilisant votre compte d'entreprise :

   * Le système vous redirigera vers la page d'authentification de **{{projectName}}**.
   * Saisissez vos identifiants d'entreprise.

    <img src="./images/integrations-gitlab-03.webp" alt="Widget de connexion GitLab" style="max-width:600px; width:100%">

4. Après une authentification réussie, vous devriez être redirigé vers **GitLab** et automatiquement connecté à votre compte.