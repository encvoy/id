# Cómo conectar el inicio de sesión con OpenID Connect en Encvoy ID

> 📋 Esta instrucción es parte de una serie de artículos sobre la configuración de métodos de inicio de sesión. Para más detalles, lea la guía de [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md).

En esta guía, aprenderá cómo conectar la autenticación **OpenID Connect** al sistema **Encvoy ID**.

La configuración del inicio de sesión a través de **OpenID Connect** consta de tres pasos clave realizados en dos sistemas diferentes:

- [Paso 1. Configuración en el lado del sistema externo](#step-1-configure-external-system)
- [Paso 2. Creación de un método de inicio de sesión](#step-2-create-login-method)
- [Paso 3. Adición al widget](#step-3-add-to-widget)
- [Descripción de parámetros](#parameters-description)
- [Vea también](#see-also)

---

<a name="step-1-configure-external-system"></a>

## Paso 1. Configuración en el lado del sistema externo

1. Cree una aplicación en el servicio de identidad externo.
2. Copie los valores de los campos **Application ID/Client ID** y **Secret/Client Secret**. Los necesitará al crear la aplicación en **Encvoy ID**.

---

<a name="step-2-create-login-method"></a>

## Paso 2. Creación de un método de inicio de sesión

1. Vaya al Panel de Administración → pestaña **Configuración**.

   > 💡 Para crear un método de inicio de sesión para una organización, abra el **Panel de la Organización**. Si el método de inicio de sesión es necesario para una aplicación específica, abra **la configuración de esa aplicación**.

2. Busque el bloque **Métodos de inicio de sesión** y haga clic en **Configurar**.
3. En la ventana que se abre, haga clic en el botón **Crear** ![Botón Crear](./images/button-create.webp "Botón Crear").
4. Se abrirá una ventana con una lista de plantillas.
5. Seleccione la plantilla **OpenID Connect**.
6. Complete el formulario de creación:

   **Información básica**
   - **Nombre** — El nombre que verán los usuarios.
   - **Descripción** (opcional) — Una breve descripción.
   - **Logotipo** (opcional) — Puede subir su propio icono, o se utilizará el predeterminado.

   **Parámetros de autenticación**
   - **Identificador del recurso (client_id)** — Pegue el **ID de aplicación** (`Client ID`) copiado.
   - **Clave secreta (client_secret)** — Pegue el **Secreto** (`Client Secret`) copiado.
   - **URL de redireccionamiento (Redirect URI)** — Este campo se completará automáticamente según su dominio.
   - **Dirección base del servidor de autorización (issuer)** — La dirección del servicio de identidad externo.
   - **Punto de conexión de autorización (authorization_endpoint)** — La dirección a la que se redirige al usuario para la autorización.
   - **Punto de conexión de token (token_endpoint)** — El recurso que proporciona la emisión de tokens.
   - **Punto de conexión de información de usuario (userinfo_endpoint)** — El recurso que devuelve información sobre el usuario actual.
   - **Permisos solicitados (scopes)** — Una lista de permisos que se solicitarán al proveedor de identidad. Para añadir un permiso, escriba su nombre y presione **Enter**.

   **Ajustes adicionales**
   - **Método de inicio de sesión público** — Active esto si desea que este método de inicio de sesión esté disponible para añadirse a otras aplicaciones en el sistema (u organización), así como al perfil de usuario como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Público** — Establezca el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario.

7. Haga clic en **Crear**.

Después de una creación exitosa, el nuevo método de inicio de sesión aparecerá en la lista general de proveedores.

---

<a name="step-3-add-to-widget"></a>

## Paso 3. Adición al widget

Para que el botón **Iniciar sesión con OpenID Connect** sea visible en el formulario de autorización, debe activar esta función en la configuración del widget:

1. Busque el método de inicio de sesión creado en la lista general de proveedores.
2. Active el interruptor en el panel del proveedor.

> **Verificación**: Después de guardar, abra el formulario de inicio de sesión en una aplicación de prueba. Debería aparecer un nuevo botón con el logotipo de **OpenID Connect** en el widget.

---

<a name="parameters-description"></a>

## Descripción de parámetros

### Información básica

| Nombre          | Descripción                                                                                            | Tipo                 | Límites             |
| --------------- | ------------------------------------------------------------------------------------------------------ | -------------------- | ------------------- |
| **Nombre**      | El nombre que se mostrará en la interfaz del servicio **Encvoy ID**                                    | Texto                | Máx. 50 caracteres  |
| **Descripción** | Una breve descripción que se mostrará en la interfaz del servicio **Encvoy ID**                        | Texto                | Máx. 255 caracteres |
| **Logotipo**    | La imagen que se mostrará en la interfaz del servicio **Encvoy ID** y en el widget de inicio de sesión | JPG, GIF, PNG o WEBP | Tamaño máx.: 1 MB   |

### Parámetros de autenticación

| Nombre                                                              | Parámetro                | Descripción                                                                                                                         |
| ------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Identificador del recurso (client_id)**                           | `client_id`              | ID de la aplicación creada en el sistema externo                                                                                    |
| **Clave secreta (client_secret)**                                   | `client_secret`          | Clave de acceso al servicio de la aplicación creada en el lado del sistema externo                                                  |
| **URL de redireccionamiento (Redirect URI)** (no editable)          | `redirect URI`           | La dirección de **Encvoy ID** a la que se redirige al usuario después de la autenticación en el servicio de terceros                |
| **Dirección base del servidor de autorización (issuer)**            | `issuer`                 | La dirección del servicio de identidad externo                                                                                      |
| **Punto de conexión de autorización (authorization_endpoint)**      | `authorization_endpoint` | La dirección a la que se redirige al usuario para la autorización                                                                   |
| **Punto de conexión de token (token_endpoint)**                     | `token_endpoint`         | El recurso que proporciona la emisión de tokens                                                                                     |
| **Punto de conexión de información de usuario (userinfo_endpoint)** | `userinfo_endpoint`      | El recurso que devuelve información sobre el usuario actual                                                                         |
| **Permisos solicitados (scopes)**                                   | -                        | Una lista de permisos que se solicitarán al proveedor de identidad. Para añadir un permiso, escriba su nombre y presione **Enter**. |

### Ajustes adicionales

| Nombre                                 | Descripción                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Método de inicio de sesión público** | Cuando se activa: <br> - El método de inicio de sesión está disponible para añadirse a otras aplicaciones del servicio. <br> - El método de inicio de sesión está disponible para añadirse como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers) en el perfil de usuario. |
| **Público**                            | Establece el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario                                                                                                                                                                                                                  |

---

<a name="see-also"></a>

## Vea también

- [Métodos de inicio de sesión y configuración del widget de inicio de sesión](./docs-06-github-en-providers-settings.md) — guía sobre los métodos de inicio de sesión y la configuración del widget de inicio de sesión.
- [Gestión de la organización](./docs-11-common-org-settings.md) — guía sobre el trabajo con organizaciones en el sistema **Encvoy ID**.
- [Perfil personal y gestión de permisos de aplicaciones](./docs-12-common-personal-profile.md) — guía sobre la gestión del perfil personal.
