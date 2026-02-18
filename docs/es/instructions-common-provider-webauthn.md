---
title: "Inicio de sesión con WebAuthn — Conexión en Encvoy ID"
description: "Aprenda cómo conectar el inicio de sesión con WebAuthn en Encvoy ID: cree un método de inicio de sesión y añádalo al widget de autorización. Conéctelo en solo unos pasos."
keywords:
  - inicio de sesión WebAuthn
  - autenticación WebAuthn
  - conexión WebAuthn
  - configuración WebAuthn
  - WebAuthn Encvoy ID
  - iniciar sesión mediante WebAuthn Encvoy ID
  - configurar WebAuthn en Encvoy ID
author: "Equipo de Encvoy ID"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Inicio de sesión mediante WebAuthn"
---

# Cómo conectar el inicio de sesión con WebAuthn en Encvoy ID

> 📋 Esta instrucción es parte de una serie de artículos sobre la configuración de métodos de inicio de sesión. Para más detalles, lea la guía de [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md).

En esta guía, aprenderá cómo conectar la autenticación **WebAuthn** al sistema **Encvoy ID**.

**Tabla de contenidos:**

- [Información General](#general-info)
- [Configuración de la autenticación WebAuthn para administradores](#webauthn-admin-setup)
- [Añadir una llave para un usuario](#adding-key-for-user)
- [Ver también](#see-also)

---

## Información General { #general-info }

**WebAuthn** (Web Authentication) es un estándar de autenticación que permite a los usuarios iniciar sesión sin contraseña utilizando métodos de verificación seguros:

- biometría (Face ID, Touch ID);
- llaves de seguridad de hardware;
- módulos de seguridad integrados en el dispositivo.

**WebAuthn** es parte de la especificación **FIDO2** y es compatible con todos los navegadores modernos.

> 🔐 **WebAuthn** puede utilizarse como método de inicio de sesión principal o como un factor adicional para la autenticación multifactor.

### Cómo funciona WebAuthn

1. **Registro de usuario:**
   - El usuario crea una llave de autenticación.
   - El dispositivo genera un par de llaves: la llave pública se almacena en el sistema, mientras que la llave privada permanece solo con el usuario.

2. **Inicio de sesión:**
   - El usuario selecciona el método de inicio de sesión **WebAuthn** en el recurso web.
   - El servidor envía un desafío (`challenge`) para verificar la identidad.

3. **Autenticación del usuario:**
   - El dispositivo o token firma el `challenge` con la llave privada.
   - El servidor verifica la firma utilizando la llave pública almacenada.
   - Si la firma es válida, se concede el acceso al usuario.

4. **Establecimiento de un canal seguro:** Tras una autenticación exitosa, el usuario accede al sistema sin transmitir una contraseña a través de la red.

---

## Configuración de la autenticación WebAuthn para administradores { #webauthn-admin-setup }

### Paso 1. Creación de un método de inicio de sesión

1. Vaya al Panel de Administración → pestaña **Configuración**.

   > 💡 Para crear un método de inicio de sesión para una organización, abra el **Panel de la Organización**. Si el método es necesario para una aplicación específica, abra la **configuración de esa aplicación**.

2. Busque el bloque **Métodos de inicio de sesión** y haga clic en **Configurar**.
3. En la ventana que se abre, haga clic en el botón **Crear** ![Botón Crear](./images/button-create.webp "Botón Crear").
4. Se abrirá una ventana con una lista de plantillas.
5. Seleccione la plantilla **WebAuthn**.
6. Complete el formulario de creación:

   **Información Básica**
   - **Nombre** — El nombre que verán los usuarios.
   - **Descripción** (opcional) — Una breve descripción.
   - **Logotipo** (opcional) — Puede subir su propio icono, o se utilizará el predeterminado.

   **Configuraciones Adicionales**
   - **Método de inicio de sesión público** — Active esto para que el método de inicio de sesión pueda añadirse al perfil de usuario como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Público** — Establezca el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario.

7. Haga clic en **Crear**.

Tras la creación exitosa, el nuevo método de inicio de sesión aparecerá en la lista general de proveedores.

### Paso 2. Adición del proveedor WebAuthn al Widget

Para que el botón de **WebAuthn** sea visible para los usuarios en el formulario de autorización, debe activar esta función en la configuración del widget:

1. Busque el método de inicio de sesión creado en la lista general de proveedores.
2. Cambie el interruptor en el panel del proveedor a la posición "On".

> **Verificación**: Después de guardar, abra el formulario de inicio de sesión en una aplicación de prueba. Debería aparecer un nuevo botón con el logotipo de **WebAuthn** en el widget.

---

## Añadir una llave para un usuario { #adding-key-for-user }

### Paso 1. Añadir una llave al dispositivo

Registrar una llave **WebAuthn** es el proceso de crear un par de llaves pública y privada y vincularlo a un usuario específico.

Para usar el inicio de sesión con **WebAuthn**, el usuario debe registrar primero una llave; esta puede ser un autenticador integrado (por ejemplo, **Touch ID**, **Face ID** o **Windows Hello**) o una llave de seguridad física externa.

Durante el proceso de adición de la llave, se crea un par criptográfico único: **llaves pública** y **privada**.

- La llave privada se almacena de forma segura en el dispositivo del usuario y nunca se transmite por la red.
- La llave pública se almacena en el servidor de **Encvoy ID** y se utiliza para la verificación de autenticación posterior durante el inicio de sesión.

Después de registrar la llave, el usuario debe añadir el identificador **WebAuthn** a su perfil de **Encvoy ID**.

### Paso 2. Añadir el identificador al perfil

1. Vaya a su **Perfil**.
2. Haga clic en **Agregar** en el bloque **Identificadores**.

<img src="./images/personal-profile-12.webp" alt="Bloque de identificadores en el perfil de usuario" style="max-width:600px; width:100%">

3. En la ventana que se abre, seleccione el método de inicio de sesión **WebAuthn**.
4. En el diálogo del sistema, especifique la llave registrada previamente.

> 💡 **Consejo**: Si el identificador ya está vinculado a otro usuario, debe eliminarse del perfil de ese usuario antes de poder vincularlo a la nueva cuenta.

---

## Ver también { #see-also }

- [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md) — una guía sobre los métodos de inicio de sesión y la configuración del widget de acceso.
- [Gestión de Organizaciones](./docs-09-common-mini-widget-settings.md) — una guía para trabajar con organizaciones en el sistema **Encvoy ID**.
- [Perfil Personal y Gestión de Permisos de Aplicaciones](./docs-12-common-personal-profile.md) — una guía para gestionar su perfil personal.
