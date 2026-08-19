# Comment configurer l'intégration de Grafana avec Encvoy ID

Dans ce guide, vous apprendrez comment configurer l'authentification unique (SSO) dans **Grafana** en utilisant le système **Encvoy ID**.

> 📌 [Grafana](https://www.grafana.com/) est un système de visualisation de données open-source axé sur les données des systèmes de surveillance informatique.

La configuration de la connexion via **Encvoy ID** se compose de plusieurs étapes clés effectuées dans deux systèmes différents.

- [Étape 1. Créer l'application](#step-1-create-application)
- [Étape 2. Configurer le système Grafana](#step-2-configure-grafana)
- [Étape 3. Vérifier la connexion](#step-3-verify-connection)

---

<a name="step-1-create-application"></a>

## Étape 1. Créer l'application

1. Connectez-vous au système **Encvoy ID**.
2. Créez une application avec les paramètres suivants :
   - **Adresse de l'application** - l'adresse de votre installation **Grafana** ;
   - **URL de redirection \#1 (Redirect_uri)** - `<Adresse de l'installation Grafana>/login/generic_oauth`.

   > 🔍 Pour plus de détails sur la création d'applications, consultez les [instructions](./docs-10-common-app-settings.md#creating-application).

3. Ouvrez les [paramètres de l'application](./docs-10-common-app-settings.md#editing-application) et copiez les valeurs des champs suivants :
   - **Identifiant** (`Client_id`),
   - **Clé secrète** (`client_secret`).

---

<a name="step-2-configure-grafana"></a>

## Étape 2. Configurer le système Grafana

La configuration de l'autorisation via **Encvoy ID** s'effectue dans le fichier de configuration **grafana.ini**, qui se trouve généralement sous Linux à l'emplacement suivant : `/etc/grafana/grafana.ini`.

1. Ouvrez le fichier **grafana.ini** en mode édition.
2. Recherchez ou ajoutez le bloc `[auth.generic_oauth]` et définissez les paramètres suivants :

   ```ini
      [auth.generic_oauth]
      enabled = true
      name = <NomDuSystèmeEncvoy ID>
      allow_sign_up = true
      client_id = <Client_id de l'application créée dans Encvoy ID>
      client_secret = <Client_secret de l'application créée dans Encvoy ID>
      scopes = openid profile email
      empty_scopes = false
      email_attribute_name = email:email
      email_attribute_path = data.email
      login_attribute_path = data.login
      name_attribute_path = data.givenName
      auth_url = https://<adresse du système Encvoy ID>/api/oidc/auth
      token_url = https://<adresse du système Encvoy ID>/api/oidc/token
      api_url = https://<adresse du système Encvoy ID>/api/oidc/me
   ```

   <img src="./images/integrations-grafana-01.webp" alt="Configuration du fichier de configuration Grafana" style="max-width:600px; width:100%">

3. Redémarrez le service **Grafana** pour appliquer les nouveaux paramètres.

   ```bash
   sudo systemctl restart grafana-server
   ```

---

<a name="step-3-verify-connection"></a>

## Étape 3. Vérifier la connexion

1. Ouvrez la page de connexion de **Grafana**.
2. Vérifiez que le bouton **Sign in with Encvoy ID** est apparu.
3. Cliquez sur le bouton et connectez-vous à l'aide de vos identifiants d'entreprise :
   - Vous serez redirigé vers la page d'authentification de **Encvoy ID** ;
   - Après une connexion réussie, vous serez renvoyé vers **Grafana** en tant qu'utilisateur autorisé.

   <img src="./images/integrations-grafana-02.webp" alt="Widget de connexion Grafana" style="max-width:600px; width:100%">
