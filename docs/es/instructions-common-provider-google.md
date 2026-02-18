---
title: "Inicio de sesión con Google — Conexión y configuración en Encvoy ID"
description: "Aprenda a conectar el inicio de sesión de Google en Encvoy ID: cree un método de inicio de sesión y añádalo al widget de autorización. Conéctelo en solo unos pasos."
keywords:
  - inicio de sesión Google
  - configuración Google en Encvoy ID
  - autenticación Google
  - conectar Google
  - login Google Encvoy ID
  - Google OAuth Encvoy ID
  - Google sign-in
  - autorización Google
  - Google Encvoy ID
  - iniciar sesión mediante Google Encvoy ID
author: "Equipo de Encvoy ID"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [en]
menu_title: "Inicio de sesión con Google"
---

# Cómo conectar el inicio de sesión con Google en Encvoy ID

> 📋 Esta instrucción es parte de una serie de artículos sobre la configuración de métodos de inicio de sesión. Para más detalles, lea la guía [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md).

En esta guía, aprenderá a conectar la autenticación mediante una cuenta de **Google** al sistema **Encvoy ID**. Este método de inicio de sesión permite a los usuarios acceder a las aplicaciones utilizando su cuenta de los servicios de **Google**.

La configuración del inicio de sesión con **Google** consta de tres pasos clave realizados en dos sistemas diferentes:

- [Paso 1. Configurar la aplicación en Google](#step-1-configure-google-app)
- [Paso 2. Crear el método de inicio de sesión](#step-2-create-login-method)
- [Paso 3. Añadir al widget](#step-3-add-to-widget)
- [Descripción de parámetros](#parameters-description)
- [Ver también](#see-also)

---

## Paso 1. Configurar la aplicación en Google { #step-1-configure-google-app }

Antes de configurar el método de inicio de sesión en **Encvoy ID**, debe registrar su aplicación en la consola de desarrolladores de **Google** y obtener las claves de acceso:

1. Inicie sesión con su cuenta de **Google**.
2. Abra la [Google Cloud Console](https://code.google.com/apis/console#access).
3. Cree un nuevo proyecto:
   - En el panel superior, haga clic en **Select a project** → **New Project**.
   - Especifique el nombre del proyecto (por ejemplo, `Encvoy.ID Login` o el nombre de su sitio web).
   - Haga clic en **Create**.

   > 🔗 Para más detalles, lea las instrucciones en [developers.google.com](https://developers.google.com/workspace/guides/create-project?hl=en).

4. Configure la **OAuth consent screen** (Pantalla de consentimiento de OAuth). Si ya ha realizado estos ajustes anteriormente, salte este paso.
   - Vaya a **APIs and Services** → **OAuth consent screen**.

     <img src="./images/instructions-provider-google-01.webp" alt="Creación de un método de inicio de sesión OAuth de Google en la consola de desarrolladores del servicio" style="max-width:700px; width:100%">

   - Abra la sección **Branding**.
   - Haga clic en el botón **Get started** en el centro de la ventana.
   - Proporcione la **App Information**: el nombre de la aplicación y la dirección de correo electrónico que se mostrará a los usuarios en la pantalla de consentimiento.
   - Seleccione el tipo de **Audience** → **External**.

     <img src="./images/instructions-provider-google-03.webp" alt="Configuración del nombre para el método de inicio de sesión OAuth de Google en la consola de desarrolladores del servicio" style="max-width:700px; width:100%">

   - Proporcione una dirección de correo electrónico para recibir notificaciones del proyecto.
   - Acepte la política de usuario.

     <img src="./images/instructions-provider-google-04.webp" alt="Configuración de la información de contacto para el método de inicio de sesión OAuth de Google en la consola de desarrolladores del servicio" style="max-width:700px; width:100%">

5. Cree un **OAuth Client ID**:
   - Vaya a **APIs and Services** → **Credentials**.
   - Haga clic en **Create credentials** → **OAuth client ID**.

     <img src="./images/instructions-provider-google-05.webp" alt="Configuración del método de inicio de sesión OAuth de Google en la consola de desarrolladores del servicio" style="max-width:700px; width:100%">

   - Seleccione **Type** → **Web application**.
   - Complete el nombre y la URL de retorno \#1 (`Redirect_uri`).
   - Haga clic en **Create**.

     <img src="./images/instructions-provider-google-06.webp" alt="Configuración del método de inicio de sesión OAuth de Google en la consola de desarrolladores del servicio" style="max-width:500px; width:100%">

     > ⚠️ Después de la creación, aparecerá una ventana con los datos: `Client ID` y `Client Secret`. Guarde estos valores; los necesitará al configurar en **Encvoy ID**.

     <img src="./images/instructions-provider-google-07.webp" alt="Configuración del método de inicio de sesión OAuth de Google en la consola de desarrolladores del servicio" style="max-width:500px; width:100%">

6. Verifique la configuración de la **OAuth consent screen**:

   Antes de usarlo, asegúrese de que:
   - El estado de la pantalla de consentimiento sea **Published** (Publicado), no **In development** (En desarrollo),
   - Se hayan añadido los **scopes** (alcances) requeridos: `email` y `profile`.

---

## Paso 2. Crear el método de inicio de sesión { #step-2-create-login-method }

Ahora, con las claves de **Google**, vamos a crear el proveedor correspondiente en el sistema **Encvoy ID**.

1. Vaya al panel de administrador → pestaña **Configuración**.

   > 💡 Para crear un método de inicio de sesión para una organización, abra el **panel de la organización**. Si el método de inicio de sesión es para una aplicación específica, abra la **configuración de esa aplicación**.

2. Busque el bloque **Métodos de inicio de sesión** y haga clic en **Configurar**.
3. En la ventana que se abre, haga clic en el botón **Crear** ![Botón Crear](./images/button-create.webp "Botón Crear").
4. Se abrirá una ventana con una lista de plantillas.
5. Seleccione la plantilla **Google**.
6. Complete el formulario de creación:

   **Información Básica**
   - **Nombre** — El nombre que verán los usuarios.
   - **Descripción** (opcional) — Una breve descripción.
   - **Logotipo** (opcional) — Puede subir su propio icono, o se utilizará el estándar.

   **Parámetros de Autenticación**
   - **Identificador del recurso (client_id)** — Pegue el **ID de aplicación** (`Client ID`) copiado.
   - **Clave secreta (client_secret)** — Pegue el **Secreto** (`Client Secret`) copiado.
   - **URL de redireccionamiento (Redirect URI)** — Este campo se completará automáticamente según su dominio.

   **Configuración Adicional**
   - **Método de inicio de sesión público** — Active esto si desea que este método de inicio de sesión esté disponible para añadirse a otras aplicaciones del sistema (o de la organización), así como al perfil de usuario como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Público** — Establezca el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario.

7. Haga clic en **Crear**.

Tras la creación exitosa, el nuevo método de inicio de sesión aparecerá en la lista general de proveedores.

---

## Paso 3. Añadir al widget { #step-3-add-to-widget }

Para que el botón **Iniciar sesión con Google** sea visible en el formulario de autorización, debe activar esta función en la configuración del widget:

1. En la lista general de proveedores, busque el método de inicio de sesión creado.
2. Active el interruptor en el panel del proveedor.

> **Verificación**: Después de guardar, abra el formulario de inicio de sesión en una aplicación de prueba. Debería aparecer un nuevo botón con el logotipo de **Google** en el widget.

---

## Descripción de parámetros { #parameters-description }

### Información Básica

| Nombre          | Descripción                                                                                            | Tipo                 | Restricciones       |
| --------------- | ------------------------------------------------------------------------------------------------------ | -------------------- | ------------------- |
| **Nombre**      | El nombre que se mostrará en la interfaz del servicio **Encvoy ID**                                    | Texto                | Máx. 50 caracteres  |
| **Descripción** | Una breve descripción que se mostrará en la interfaz del servicio **Encvoy ID**                        | Texto                | Máx. 255 caracteres |
| **Logotipo**    | La imagen que se mostrará en la interfaz del servicio **Encvoy ID** y en el widget de inicio de sesión | JPG, GIF, PNG o WEBP | Tamaño máx.: 1 MB   |

### Parámetros de Autenticación

| Nombre                                                     | Parámetro       | Descripción                                                                                                    |
| ---------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Identificador del recurso (client_id)**                  | `Client_id`     | El ID de la aplicación creada en **Google**                                                                    |
| **Clave secreta (client_secret)**                          | `Client_secret` | La clave de acceso al servicio de la aplicación creada en **Google**                                           |
| **URL de redireccionamiento (Redirect URI)** (no editable) | `Redirect URI`  | La dirección de **Encvoy ID** a la que se redirige al usuario tras la autenticación en el servicio de terceros |

### Configuración Adicional

| Nombre                                 | Descripción                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Método de inicio de sesión público** | Cuando se activa: <br> - El método de inicio de sesión está disponible para añadirse a otras aplicaciones del servicio. <br> - El método de inicio de sesión está disponible para añadirse como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers) en el perfil de usuario. |
| **Público**                            | Establece el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario                                                                                                                                                                                                                  |

---

## Ver también { #see-also }

- [Métodos de inicio de sesión y configuración del widget de inicio de sesión](./docs-06-github-en-providers-settings.md) — una guía sobre los métodos de inicio de sesión y la configuración del widget.
- [Gestión de organizaciones](./docs-09-common-mini-widget-settings.md) — una guía para trabajar con organizaciones en el sistema **Encvoy ID**.
- [Perfil personal y gestión de permisos de aplicaciones](./docs-12-common-personal-profile.md) — una guía para gestionar el perfil personal.
