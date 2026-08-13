---
title: "Connexion mTLS — Se connecter dans {{projectName}}"
description: "Découvrez comment activer la connexion mTLS dans {{projectName}} : créez une méthode de connexion et ajoutez-la au widget d'autorisation. Connectez-vous en quelques étapes seulement."
keywords: 
  - connexion mTLS
  - authentification mTLS
  - connexion mTLS
  - configuration mTLS
  - mTLS {{projectName}}
  - connexion via mTLS {{projectName}}
  - configurer mTLS dans {{projectName}}
date: 2025-12-12
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Connexion via mTLS"
---

# Comment configurer la connexion mTLS dans {{projectName}}

> 📋 Cette instruction fait partie d'une série d'articles sur la configuration des méthodes de connexion. Pour plus de détails, consultez le guide [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md).

Dans ce guide, vous apprendrez comment connecter l'authentification **mTLS** au système **{{projectName}}**.

La configuration de la connexion via **mTLS** se compose de plusieurs étapes clés :

1. Configuration de l'authentification mTLS pour les administrateurs de **{{projectName}}**

    - [Étape 1. Configurer Nginx pour mTLS](#step-1-configure-nginx-for-mtls)
    - [Étape 2. Créer le fournisseur mTLS](#step-2-create-mtls-provider)
    - [Étape 3. Ajouter le fournisseur mTLS au widget](#step-3-add-mtls-to-widget)

2. Liaison d'un certificat client pour les utilisateurs de **{{projectName}}**

    - [Étape 1. Installer le certificat client dans le navigateur](#step-1-install-client-certificate)
    - [Étape 2. Ajouter l'identifiant au profil](#step-2-add-identifier-to-profile)
    - [Étape 3. Vérifier](#step-3-verify)

---

## Informations générales

**mTLS** (Mutual TLS) est une méthode d'authentification basée sur la vérification mutuelle des certificats du client et du serveur.

Cette méthode offre un haut niveau de confiance et de sécurité, car la connexion au système n'est possible que si l'utilisateur possède un certificat valide signé par une autorité de certification (CA) de confiance.

Le **mTLS** est particulièrement utile pour les systèmes d'entreprise ou sensibles où il est nécessaire de minimiser le risque d'accès non autorisé.

### Flux de travail mTLS

1. **Initiation de la connexion :** Le client envoie une requête au serveur **{{projectName}}**.
2. **Demande de certificat client :** Le serveur exige la fourniture d'un certificat client.
3. **Envoi du certificat client :** Le client fournit son certificat signé par une CA de confiance.
4. **Vérification du certificat sur le serveur :**

   - Le serveur vérifie le certificat par rapport à la CA racine.
   - Vérifie la date d'expiration, la signature et la conformité aux exigences de sécurité.

5. **Authentification de l'utilisateur :**

   - Si le certificat est valide, le serveur le mappe au compte utilisateur et accorde l'accès.
   - Si le certificat est invalide ou manquant, l'accès est refusé.

6. **Établissement d'un canal sécurisé :** Après une vérification réussie du certificat, une **connexion chiffrée** est établie et l'utilisateur accède au système.

---

## Configuration de l'authentification mTLS pour les administrateurs de {{projectName}}

Pour que le **mTLS** fonctionne, vous devez :

- configurer le serveur web **Nginx** pour n'accepter que les requêtes signées par un certificat de confiance ;
- créer et activer le fournisseur **mTLS** dans l'interface de **{{projectName}}** ;
- installer les certificats clients sur les appareils des utilisateurs.

### Étape 1. Configurer Nginx pour mTLS { #step-1-configure-nginx-for-mtls }

Avant d'ajouter le fournisseur dans **{{projectName}}**, vous devez préparer la configuration **Nginx** :

1. Ouvrez le fichier de configuration `nginx.local.conf`.
2. Ajoutez un nouveau bloc `server` :

    **Exemple de configuration** :

    ```nginx
    server {
       server_name local.trusted.com;
       listen 3443 ssl;

       # Certificats du serveur
       ssl_certificate         certs/local.trusted.com.pem;
       ssl_certificate_key     certs/local.trusted.com-key.pem;

       # Certificat CA racine pour la vérification du certificat client
       ssl_client_certificate  certs/ca-bundle.crt;
       ssl_verify_client on;
       ssl_verify_depth 3;

       # Paramètres de session et de protocole
       ssl_session_timeout 10m;
       ssl_session_cache shared:SSL:10m;
       ssl_protocols TLSv1.2 TLSv1.3;

       # Restreindre l'accès au chemin principal, mTLS autorisé uniquement pour /api/mtls
       location / {
           return 404 "mTLS endpoints only. Use port 443 for regular access.";
       }

       # Paramètres de proxy vers le backend
       location /api/mtls {
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Transmission des informations du certificat client
           proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
           proxy_set_header X-SSL-Client-DN $ssl_client_s_dn;
           proxy_set_header X-SSL-Client-Serial $ssl_client_serial;
           proxy_set_header X-SSL-Client-Fingerprint $ssl_client_fingerprint;
           proxy_set_header X-SSL-Client-Issuer $ssl_client_i_dn;

           # Proxy vers le backend
           proxy_pass http://backend;
           proxy_redirect off;
       }
    }
    ```

3. Redémarrez **Nginx** après avoir effectué les modifications.

#### Description des paramètres

| Paramètre | Objectif |
| --------------------------------- | ------------------------------------------------------------ |
| `ssl_certificate` | Certificat serveur utilisé pour le HTTPS. |
| `ssl_certificate_key` | Clé privée du serveur. |
| `ssl_client_certificate` | Certificat CA racine pour vérifier les certificats clients. |
| `ssl_verify_client on` | Active la vérification obligatoire du certificat client. |
| `ssl_verify_depth` | Profondeur maximale de la chaîne de vérification du certificat client. |
| `ssl_session_timeout` | Durée de vie de la session SSL. |
| `ssl_protocols` | Versions TLS autorisées. |
| `proxy_set_header X-SSL-Client-*` | Transmet les informations du certificat client au backend. |

- Placez les certificats du serveur (`.pem` et clé) et la CA racine (`ca-bundle.crt`) dans un répertoire approprié, par exemple `certs/`.
- Spécifiez le chemin vers les certificats dans la configuration **Nginx**.

### Étape 2. Créer le fournisseur mTLS { #step-2-create-mtls-provider }

1. Allez dans le Panneau d'administration → onglet **Paramètres**.

   > 💡 Pour créer une méthode de connexion pour une organisation, ouvrez le **Tableau de bord de l'organisation**. Si la méthode de connexion est nécessaire pour une application spécifique, ouvrez les **Paramètres de cette application**.

2. Trouvez le bloc **Méthodes de connexion** et cliquez sur **Configurer**.
3. Dans la fenêtre qui s'ouvre, cliquez sur le bouton **Créer** ![Bouton Créer](./images/button-create.webp "Bouton Créer").
4. Une fenêtre avec une liste de modèles s'ouvrira.
5. Sélectionnez le modèle **mTLS**.
6. Remplissez le formulaire de création :

    **Informations de base**

    - **Nom** — Le nom que les utilisateurs verront.
    - **Description** (facultatif) — Une courte description.
    - **Logo** (facultatif) — Vous pouvez télécharger votre propre icône, sinon celle par défaut sera utilisée.

    **Paramètres supplémentaires**

    - **Méthode de connexion publique** — Activez cette option pour que la méthode de connexion puisse être ajoutée au profil utilisateur en tant qu'[identifiant de service externe](./docs-12-common-personal-profile.md#external-service-identifiers).
    - **Publicité** — Définissez le niveau de publicité par défaut pour l'identifiant de service externe dans le profil utilisateur.

7. Cliquez sur **Créer**.

Après une création réussie, la nouvelle méthode de connexion apparaîtra dans la liste générale des fournisseurs.

### Étape 3. Ajouter le fournisseur mTLS au widget { #step-3-add-mtls-to-widget }

Pour que les utilisateurs voient le bouton **mTLS** sur le formulaire d'autorisation, vous devez activer cette fonctionnalité dans les paramètres du widget :

1. Trouvez la méthode de connexion créée dans la liste générale des fournisseurs.
2. Activez l'interrupteur sur le panneau du fournisseur.

> **Vérification** : Après avoir enregistré, ouvrez le formulaire de connexion dans une application de test. Un nouveau bouton avec le logo **mTLS** devrait apparaître sur le widget.

---

## Liaison d'un certificat client pour les utilisateurs de {{projectName}}

> 📌 Cette instruction est destinée aux utilisateurs qui doivent se connecter au système via **mTLS**.

### Étape 1. Installer le certificat client dans le navigateur { #step-1-install-client-certificate }

Avant l'installation, assurez-vous d'avoir un fichier de certificat au format `.p12` ou `.pfx`.

Ce fichier doit contenir :

- votre certificat personnel,
- la clé privée,
- et la chaîne de confiance (si nécessaire).

#### Installation dans Google Chrome / Microsoft Edge

1. Ouvrez le navigateur **Chrome** ou **Edge**.
2. Allez dans **Paramètres** → **Confidentialité et sécurité**.
3. Trouvez la section **Sécurité**.
4. Cliquez sur **Gérer les certificats**.
5. Allez sur l'onglet **Personnel** / **Vos certificats**.
6. Cliquez sur **Importer...**.
7. Dans l'assistant d'importation, cliquez sur **Suivant**.
8. Cliquez sur **Parcourir** et sélectionnez votre fichier `.p12` ou `.pfx`.
9. Entrez le mot de passe que vous avez reçu avec le certificat.
10. Sélectionnez **Placer tous les certificats dans le magasin suivant**.
11. Cliquez sur **Parcourir** et sélectionnez **Personnel**.
12. Cliquez sur **Suivant** → **Terminer**.
13. Si un avertissement de sécurité apparaît, cliquez sur **Oui**.

Après une installation réussie, le certificat apparaîtra dans la liste de l'onglet **Personnel** / **Vos certificats**.

#### Installation dans Mozilla Firefox

1. Ouvrez le menu **Firefox** → **Paramètres**
2. Allez dans la section **Vie privée et sécurité**
3. Faites défiler jusqu'à **Certificats**
4. Cliquez sur **Afficher les certificats...**
5. Allez sur l'onglet **Vos certificats**
6. Cliquez sur **Importer...**
7. Sélectionnez votre fichier `.p12` ou `.pfx`
8. Entrez le mot de passe du certificat
9. Cliquez sur **OK**

Après une installation réussie, le certificat apparaîtra dans la liste de l'onglet **Vos certificats**.

> ⚠️ Les certificats ne doivent être installés que sur des appareils de confiance, et le mot de passe doit être gardé strictement confidentiel.

> 💡 Après avoir installé le certificat, lors de la connexion via **mTLS**, le navigateur vous demandera automatiquement de sélectionner le certificat approprié pour l'authentification.

### Étape 2. Ajouter l'identifiant au profil { #step-2-add-identifier-to-profile }

1. Allez dans votre **Profil**.
2. Cliquez sur **Ajouter** dans le bloc **Identifiants**.

    <img src="./images/personal-profile-12.webp" alt="Bloc Identifiants dans le profil utilisateur" style="max-width:600px; width:100%">

3. Dans la fenêtre qui s'ouvre, sélectionnez la méthode de connexion **mTLS**.
4. Sélectionnez le certificat installé à l'étape précédente.

> 💡 **Conseil** : Si l'identifiant est déjà lié à un autre utilisateur, vous devez le supprimer du profil de cet utilisateur avant de le lier au nouveau compte.

### Étape 3. Vérifier { #step-3-verify }

1. Allez sur la page de connexion où la méthode de connexion **mTLS** est activée.
2. Sélectionnez l'icône de la méthode de connexion **mTLS**.

   - **Première connexion** : le système peut vous demander de sélectionner un certificat client.
   - **Connexions suivantes** : l'authentification est effectuée automatiquement à l'aide du certificat précédemment sélectionné.

---

## Voir aussi

- [Méthodes de connexion et configuration du widget](./docs-06-github-en-providers-settings.md) — guide sur les méthodes de connexion et la configuration du widget de connexion.
- [Gestion de l'organisation](./docs-09-common-mini-widget-settings.md) — guide sur le travail avec les organisations dans le système **{{projectName}}**.
- [Profil personnel et gestion des permissions d'application](./docs-12-common-personal-profile.md) — guide sur la gestion de votre profil personnel.