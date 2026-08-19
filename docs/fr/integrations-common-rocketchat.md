# Comment configurer l'intégration de Rocket.Chat avec Encvoy ID

Dans ce guide, vous apprendrez comment configurer l'authentification unique (SSO) dans **Rocket.Chat** via le système **Encvoy ID**.

> 📌 [Rocket.Chat](https://www.rocket.chat/) est une plateforme de messagerie open-source conçue pour le travail d'équipe et la communication. Elle offre des fonctionnalités similaires à des services comme **Slack** ou **Microsoft Teams**, mais avec la possibilité d'un auto-hébergement sur votre propre serveur.

La configuration de la connexion via **Encvoy ID** se compose de plusieurs étapes clés réalisées dans deux systèmes différents :

- [Étape 1. Créer une connexion dans Rocket.Chat](#step-1-create-rocketchat-connection)
- [Étape 2. Créer une application](#step-2-create-application)
- [Étape 3. Configurer la connexion dans Rocket.Chat](#step-3-configure-rocketchat)
- [Étape 4. Vérifier la connexion](#step-4-verify-connection)

---

<a name="step-1-create-rocketchat-connection"></a>

## Étape 1. Créer une connexion dans Rocket.Chat

1. Connectez-vous à **Rocket.Chat** avec des droits d'administrateur.
2. Ouvrez le menu et sélectionnez **Workspace**.

<img src="./images/integrations-rocketchat-01.webp" alt="Navigation vers Workspace dans Rocket.Chat" style="max-width:400px; width:100%">

3. La section **Administration** s'ouvrira.
4. Allez dans la sous-section **Settings** et cliquez sur **Open** dans le bloc **OAuth**.

<img src="./images/integrations-rocketchat-02.webp" alt="Section Paramètres dans le panneau d'administration Rocket.Chat" style="max-width:700px; width:100%">

5. Cliquez sur le bouton **Add custom OAuth**.

<img src="./images/integrations-rocketchat-03.webp" alt="Ajout d'une connexion dans Rocket.Chat" style="max-width:700px; width:100%">

6. Dans la fenêtre qui apparaît, spécifiez un nom unique pour le **service OAuth** connecté et cliquez sur **Add**.

<img src="./images/integrations-rocketchat-04.webp" alt="Dialogue pour spécifier le nom de la connexion" style="max-width:400px; width:100%">

7. La connexion créée apparaîtra dans la liste générale des connexions. Si ce n'est pas le cas, actualisez la page du navigateur.
8. Développez les paramètres de la connexion et copiez l'**URL de rappel (Callback URL)**.

<img src="./images/integrations-rocketchat-06.webp" alt="URL de rappel dans les paramètres de connexion" style="max-width:400px; width:100%">

---

<a name="step-2-create-application"></a>

## Étape 2. Créer une application

1. Connectez-vous à **Encvoy ID**.
2. Créez une nouvelle application et spécifiez :
   - **Adresse de l'application** - l'adresse de votre installation **Rocket.Chat** ;
   - **URL de rappel n°1 (Redirect_uri)** - collez la valeur copiée de la connexion créée dans **Rocket.Chat**.

     > 🔍 Pour plus de détails sur la création d'applications, lisez les [instructions](./docs-10-common-app-settings.md#creating-application).

3. Ouvrez les [paramètres de l'application](./docs-10-common-app-settings.md#editing-application) et copiez les valeurs des champs suivants :
   - **Identifiant** (`Client_id`),
   - **Clé secrète** (`client_secret`).

---

<a name="step-3-configure-rocketchat"></a>

## Étape 3. Configurer la connexion dans Rocket.Chat

1. Retournez dans **Rocket.Chat**.
2. Ouvrez les paramètres de la connexion créée à l'étape 1.
3. Basculez l'interrupteur **Enable** pour activer la connexion, ou activez-la plus tard après avoir configuré tous les paramètres.

<img src="./images/integrations-rocketchat-05.webp" alt="Paramètres de connexion dans Rocket.Chat" style="max-width:700px; width:100%">

4. Spécifiez les paramètres de connexion :
   - **URL** — L'URL du service Encvoy ID. Par exemple : `https://<adresse d'installation Encvoy ID>`
   - **Token Path** — Il s'agit de la partie de l'URL du point de terminaison du jeton (Token Endpoint) qui spécifie le chemin pour obtenir les jetons. Par exemple : **/api/oidc/token**.
   - **Identity Path** — Le point de terminaison avec les informations utilisateur. Par exemple : **/api/oidc/me**.
   - **Authorize Path** — Le chemin du point de terminaison d'autorisation. Par exemple : **/api/oidc/auth**.
   - **Scope** — Les autorisations nécessaires pour récupérer les données. Le scope requis est **openid** et le scope standard est **profile**. Lorsque vous spécifiez plusieurs autorisations, séparez-les par un espace. Par exemple : **profile email openid**.
   - **Id** — L'Identifiant (`Client_id`). Copiez la valeur créée à l'étape 2.
   - **Secret** — La Clé secrète (`Client_secret`). Copiez la valeur créée à l'étape 2.

5. Spécifiez les paramètres restants. Des descriptions détaillées des paramètres peuvent être trouvées sur le portail de documentation [docs.rocket.chat](https://docs.rocket.chat/docs/oauth).
6. Enregistrez les paramètres de connexion.

Après avoir terminé toutes les étapes, un bouton de connexion pour **Encvoy ID** apparaîtra dans le widget d'autorisation de **Rocket.Chat**.

---

<a name="step-4-verify-connection"></a>

## Étape 4. Vérifier la connexion

1. Ouvrez la page de connexion de **Rocket.Chat**.
2. Assurez-vous que le bouton **Login with Encvoy ID** est apparu.
3. Cliquez sur le bouton et connectez-vous en utilisant vos identifiants d'entreprise :
   - Vous serez redirigé vers la page d'authentification de **Encvoy ID** ;
   - Après une connexion réussie, vous serez renvoyé vers **Rocket.Chat** en tant qu'utilisateur autorisé.

   <img src="./images/integrations-rocketchat-07.webp" alt="Widget de connexion Rocket.Chat" style="max-width:400px; width:100%">
