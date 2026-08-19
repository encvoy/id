# Cómo configurar la integración de Grafana con Encvoy ID

En esta guía, aprenderá a configurar el inicio de sesión único (SSO) en **Grafana** utilizando el sistema **Encvoy ID**.

> 📌 [Grafana](https://www.grafana.com/) es un sistema de visualización de datos de código abierto centrado en datos de sistemas de monitorización de TI.

La configuración del inicio de sesión a través de **Encvoy ID** consta de varios pasos clave realizados en dos sistemas diferentes.

- [Paso 1. Crear la aplicación](#step-1-create-application)
- [Paso 2. Configurar el sistema Grafana](#step-2-configure-grafana)
- [Paso 3. Verificar la conexión](#step-3-verify-connection)

---

<a name="step-1-create-application"></a>

## Paso 1. Crear la aplicación

1. Inicie sesión en el sistema **Encvoy ID**.
2. Cree una aplicación con los siguientes ajustes:
   - **Dirección de la aplicación** - la dirección de su instalación de **Grafana**;
   - **URL de redireccionamiento \#1 (Redirect_uri)** - `<dirección de instalación de Grafana>/login/generic_oauth`.

   > 🔍 Para más detalles sobre la creación de aplicaciones, lea las [instrucciones](./docs-10-common-app-settings.md#creating-application).

3. Abra la [configuración de la aplicación](./docs-10-common-app-settings.md#editing-application) y copie los valores de los siguientes campos:
   - **Identificador** (`Client_id`),
   - **Clave secreta** (`client_secret`).

---

<a name="step-2-configure-grafana"></a>

## Paso 2. Configurar el sistema Grafana

La configuración de la autorización a través de **Encvoy ID** se realiza en el archivo de configuración **grafana.ini**, que en Linux se encuentra normalmente en: `/etc/grafana/grafana.ini`.

1. Abra el archivo **grafana.ini** en modo de edición.
2. Busque o añada el bloque `[auth.generic_oauth]` y establezca los siguientes parámetros:

   ```ini
      [auth.generic_oauth]
      enabled = true
      name = <Encvoy IDSystemName>
      allow_sign_up = true
      client_id = <Client_id de la aplicación creada en Encvoy ID>
      client_secret = <Client_secret de la aplicación creada en Encvoy ID>
      scopes = openid profile email
      empty_scopes = false
      email_attribute_name = email:email
      email_attribute_path = data.email
      login_attribute_path = data.login
      name_attribute_path = data.givenName
      auth_url = https://<dirección del sistema Encvoy ID>/api/oidc/auth
      token_url = https://<dirección del sistema Encvoy ID>/api/oidc/token
      api_url = https://<dirección del sistema Encvoy ID>/api/oidc/me
   ```

   <img src="./images/integrations-grafana-01.webp" alt="Configuración del archivo de configuración de Grafana" style="max-width:600px; width:100%">

3. Reinicie el servicio de **Grafana** para aplicar los nuevos ajustes.

   ```bash
   sudo systemctl restart grafana-server
   ```

---

<a name="step-3-verify-connection"></a>

## Paso 3. Verificar la conexión

1. Abra la página de inicio de sesión de **Grafana**.
2. Asegúrese de que haya aparecido el botón **Sign in with Encvoy ID**.
3. Haga clic en el botón e inicie sesión con sus credenciales corporativas:
   - Será redirigido a la página de autenticación de **Encvoy ID**;
   - Tras un inicio de sesión exitoso, volverá a **Grafana** como usuario autorizado.

   <img src="./images/integrations-grafana-02.webp" alt="Widget de inicio de sesión de Grafana" style="max-width:600px; width:100%">
