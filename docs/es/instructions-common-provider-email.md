---
title: "Inicio de sesión por correo electrónico en Encvoy ID — Configuración de correo electrónico"
description: "Aprenda a habilitar el inicio de sesión por correo electrónico en Encvoy ID: cree un método de inicio de sesión y añádalo al widget de autorización. Conéctelo en solo unos pasos."
keywords:
  - inicio de sesión por correo electrónico en Encvoy ID
  - configuración de correo electrónico
  - autenticación por correo electrónico
  - conectar correo electrónico
  - Inicio de sesión por Email Encvoy ID
  - OAuth por Email Encvoy ID
author: Equipo de Encvoy ID
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Inicio de sesión por Email"
---

# Cómo conectar el inicio de sesión por correo electrónico en Encvoy ID

> 📋 Esta instrucción es parte de una serie de artículos sobre la configuración de métodos de inicio de sesión. Para más detalles, consulte la guía de [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md).

En esta guía, aprenderá cómo habilitar la autenticación por correo electrónico en su organización o aplicación. El método de inicio de sesión por Email se utilizará para enviar notificaciones por correo electrónico, como correos de registro, recuperación de contraseña y otros eventos.

La configuración del inicio de sesión a través de **Email** consta de varios pasos:

- [Paso 1. Creación de un método de inicio de sesión](#step-1-create-login-method)
- [Paso 2. Adición al widget](#step-2-add-to-widget)

---

## Paso 1. Creación de un método de inicio de sesión { #step-1-create-login-method }

1. Vaya al Panel de Administración → pestaña **Configuración**.

   > 💡 Para crear un método de inicio de sesión para una organización, abra el **Panel de la Organización**. Si el método de inicio de sesión es necesario para una aplicación específica, abra **la configuración de esa aplicación**.

2. Busque el bloque **Métodos de inicio de sesión** y haga clic en **Configurar**.
3. En la ventana que se abre, haga clic en el botón **Crear** ![Botón Crear](./images/button-create.webp "Botón Crear").
4. Se abrirá una ventana con una lista de plantillas.
5. Seleccione la plantilla **Email**.
6. Complete el formulario de creación:

   **Información básica**
   - **Nombre** — El nombre que verán los usuarios.
   - **Descripción** (opcional) — Una breve descripción.
   - **Logotipo** (opcional) — Puede subir su propio icono, o se utilizará el estándar.

   **Parámetros**
   - **Dirección de correo principal** — La dirección de correo electrónico principal que se utilizará para enviar correos.
   - **Dirección del servidor de correo saliente** — La dirección del servidor de correo saliente.
   - **Puerto del servidor de correo saliente** — El puerto del servidor de correo saliente.
   - **Contraseña del correo** — Una contraseña normal o una contraseña de aplicación creada en la configuración de la cuenta del servicio de correo.
   - **Tiempo de vida del código de verificación** — El tiempo de vida del código de confirmación para el servicio de correo en segundos.

   **Configuración adicional**
   - **Método de inicio de sesión público** — Active esto si desea que este método de inicio de sesión esté disponible para agregarse a otras aplicaciones del sistema (o de la organización), así como al perfil de usuario como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers).

7. Haga clic en **Crear**.

Tras la creación exitosa, el nuevo método de inicio de sesión aparecerá en la lista general de proveedores.

---

## Paso 2. Adición al widget { #step-2-add-to-widget }

Para que el botón de **Inicio de sesión por Email** sea visible para los usuarios en el formulario de autorización, debe activar esta función en la configuración del widget:

1. Busque el método de inicio de sesión creado en la lista general de proveedores.
2. Active el interruptor en el panel del proveedor.

> **Verificación**: Después de guardar, abra el formulario de inicio de sesión en una aplicación de prueba. Debería aparecer un nuevo botón con el logotipo de **Email** en el widget.

---

## Ver también

- [Métodos de inicio de sesión y configuración del widget de inicio de sesión](./docs-06-github-en-providers-settings.md) — una guía sobre los métodos de inicio de sesión y la configuración del widget de inicio de sesión.
- [Gestión de la organización](./docs-09-common-mini-widget-settings.md) — una guía para trabajar con organizaciones en el sistema **Encvoy ID**.
- [Perfil personal y gestión de permisos de aplicaciones](./docs-12-common-personal-profile.md) — una guía para gestionar el perfil personal.
