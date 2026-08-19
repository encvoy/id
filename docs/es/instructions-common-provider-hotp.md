# Cómo conectar el inicio de sesión mediante HOTP en Encvoy ID

> 📋 Esta instrucción es parte de una serie de artículos sobre la configuración de métodos de inicio de sesión. Para más detalles, consulte la guía de [Métodos de inicio de sesión y configuración del Widget](./docs-06-github-en-providers-settings.md).

En esta guía, aprenderá cómo conectar la autenticación por contraseña de un solo uso **HOTP** al sistema **Encvoy ID**.

A quién va dirigida esta guía:

- Administradores — para configurar el método de inicio de sesión en el sistema.
- Usuarios — para vincular **HOTP** a su perfil.

La configuración del inicio de sesión mediante **HOTP** consta de varias etapas clave:

- [Configuración de autenticación para administradores](#admin-authentication-setup)
- [Vinculación de HOTP para usuarios](#hotp-user-binding)

---

## Información General

**HOTP** (HMAC-based One-Time Password) es un algoritmo para generar contraseñas de un solo uso basado en una clave secreta y un contador que se incrementa con cada uso exitoso del código. Se utiliza ampliamente para la autenticación de dos factores, añadiendo una capa de seguridad sobre el nombre de usuario y la contraseña estándar.

La principal diferencia entre **HOTP** y **TOTP** es que los códigos no dependen del tiempo. Cada uso de un código incrementa el contador, y el servidor verifica el código ingresado comparándolo con el valor actual del contador.

> 💡 Para crear un método de inicio de sesión basado en **TOTP**, utilice la guía [Cómo conectar el inicio de sesión mediante TOTP](./instructions-common-provider-totp.md).

**Componentes principales:**

- **Servidor de autenticación** — el servidor que genera la clave secreta y verifica los códigos ingresados, teniendo en cuenta el contador.
- **Autenticador** — una aplicación que almacena la clave secreta y el contador actual, generando contraseñas de un solo uso.
- **Clave secreta** — una base compartida entre el servidor y la aplicación utilizada para generar códigos.

### Cómo funciona HOTP

1. **Configuración preliminar**
   - El administrador crea un método de inicio de sesión **HOTP** y lo activa para los widgets de las aplicaciones requeridas.
   - El usuario añade un nuevo identificador **HOTP** en su perfil escaneando un código QR con la clave secreta utilizando una aplicación de autenticación.

2. **Generación y verificación de códigos**
   - La aplicación de autenticación calcula una contraseña de un solo uso basada en la clave secreta y el valor actual del contador utilizando el algoritmo `SHA1`, `SHA256` o `SHA512`.
   - Cuando el usuario introduce el código en el formulario de inicio de sesión, el servidor calcula el código esperado utilizando el mismo secreto y el contador actual.
   - Si el código coincide, el servidor incrementa el contador y concede el acceso al usuario.

> 🚨 **Importante**: **HOTP** no depende del tiempo, por lo que no se requiere sincronización de reloj.

---

<a name="admin-authentication-setup"></a>

## Configuración de autenticación para administradores

### Paso 1. Creación de un método de inicio de sesión

1. Vaya al Panel de Administración → pestaña **Configuración**.

   > 💡 Para crear un método de inicio de sesión para una organización, abra el **Panel de la Organización**. Si el método de inicio de sesión es necesario para una aplicación específica, abra la **configuración de esa aplicación**.

2. Busque el bloque **Métodos de inicio de sesión** y haga clic en **Configurar**.
3. En la ventana que se abre, haga clic en el botón **Crear** ![Botón Crear](./images/button-create.webp "Botón Crear").
4. Se abrirá una ventana con una lista de plantillas.
5. Seleccione la plantilla **HOTP**.
6. Complete el formulario de creación:

   **Información básica**
   - **Nombre** — El nombre que verán los usuarios.
   - **Descripción** (opcional) — Una breve descripción.
   - **Logotipo** (opcional) — Puede subir su propio icono, o se utilizará el predeterminado.

   **Parámetros**
   - **Número de dígitos** — El número de dígitos en la contraseña de un solo uso (normalmente 6).
   - **Valor inicial del contador** — Contador actual (no editable).
   - **Algoritmo** — Algoritmo de hashing (`SHA1`, `SHA256` o `SHA512`) (normalmente `SHA-1`).

   **Configuración avanzada**
   - **Método de inicio de sesión público** — Active esto si desea que este método de inicio de sesión esté disponible para agregarse a otras aplicaciones del sistema (o de la organización), así como al perfil de usuario como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Público** — Establezca el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario.

7. Haga clic en **Crear**.

Tras la creación exitosa, el nuevo método de inicio de sesión aparecerá en la lista general de proveedores.

### Paso 2. Adición del proveedor HOTP al Widget

Para que el botón **HOTP** sea visible para los usuarios en el formulario de autorización, debe activar esta función en la configuración del widget:

1. Busque el método de inicio de sesión creado en la lista general de proveedores.
2. Active el interruptor en el panel del proveedor.

> **Verificación**: Después de guardar, abra el formulario de inicio de sesión en una aplicación de prueba. Debería aparecer un nuevo botón con el logotipo de **HOTP** en el widget.

---

<a name="hotp-user-binding"></a>

## Vinculación de HOTP para usuarios

> 📌 Esta instrucción está destinada a usuarios que necesitan iniciar sesión en el sistema a través de **HOTP**.

### Paso 1. Instalación de una aplicación de autenticación

Debe instalar una aplicación en su dispositivo móvil que genere códigos HOTP.

Las opciones más populares son:

- **Google Authenticator** (Google)

### Paso 2. Adición de un identificador HOTP al perfil

1. Vaya a su **Perfil**.
2. Haga clic en **Agregar** en el bloque **Identificadores**.

<img src="./images/personal-profile-12.webp" alt="Bloque de identificadores en el perfil de usuario de Encvoy ID" style="max-width:600px; width:100%">

3. En la ventana que se abre, seleccione el método de inicio de sesión **HOTP**.

4. Escanee el código QR utilizando la aplicación de autenticación.
5. Ingrese el código de la aplicación y confirme.

> 💡 **Consejo**: Si el identificador ya está vinculado a otro usuario, debe eliminarlo del perfil de ese usuario antes de vincularlo a la nueva cuenta.

### Paso 3. Verificación

1. Vaya a la página de inicio de sesión donde el método de inicio de sesión **HOTP** está habilitado.
2. Seleccione el icono del método de inicio de sesión **HOTP**.
3. Se abrirá un formulario para ingresar el código. Sin cerrar la página, abra la aplicación de autenticación en su teléfono.
4. Busque el servicio correspondiente a **Encvoy ID** (o el nombre de la aplicación) e ingrese su nombre de usuario y el código de 6 dígitos en el campo del formulario de inicio de sesión.
5. Haga clic en el botón **Confirmar**.

---

## Ver también

- [Métodos de inicio de sesión y configuración del Widget de inicio de sesión](./docs-06-github-en-providers-settings.md) — una guía sobre los métodos de inicio de sesión y la configuración del widget de inicio de sesión.
- [Gestión de la Organización](./docs-11-common-org-settings.md) — una guía para trabajar con organizaciones en el sistema **Encvoy ID**.
- [Perfil personal y gestión de permisos de aplicaciones](./docs-12-common-personal-profile.md) — una guía para gestionar su perfil personal.
