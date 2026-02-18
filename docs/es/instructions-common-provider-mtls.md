---
title: "Inicio de sesión mTLS — Conexión en Encvoy ID"
description: "Aprenda a habilitar el inicio de sesión mTLS en Encvoy ID: cree un método de inicio de sesión y añádalo al widget de autorización. Conéctese en solo unos pasos."
keywords:
  - inicio de sesión mTLS
  - autenticación mTLS
  - conexión mTLS
  - configuración mTLS
  - mTLS Encvoy ID
  - iniciar sesión mediante mTLS Encvoy ID
  - configurar mTLS en Encvoy ID
date: 2025-12-12
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Inicio de sesión mediante mTLS"
---

# Cómo conectar el inicio de sesión mTLS en Encvoy ID

> 📋 Esta instrucción es parte de una serie de artículos sobre la configuración de métodos de inicio de sesión. Para más detalles, lea la guía de [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md).

En esta guía, aprenderá cómo conectar la autenticación **mTLS** al sistema **Encvoy ID**.

La configuración del inicio de sesión mediante **mTLS** consta de varias etapas clave:

1. Configuración de la autenticación mTLS para administradores de **Encvoy ID**
   - [Paso 1. Configurar Nginx para mTLS](#step-1-configure-nginx-for-mtls)
   - [Paso 2. Crear el proveedor mTLS](#step-2-create-mtls-provider)
   - [Paso 3. Añadir el proveedor mTLS al widget](#step-3-add-mtls-to-widget)

2. Vinculación de un certificado de cliente para usuarios de **Encvoy ID**
   - [Paso 1. Instalar el certificado de cliente en el navegador](#step-1-install-client-certificate)
   - [Paso 2. Añadir el identificador al perfil](#step-2-add-identifier-to-profile)
   - [Paso 3. Verificar](#step-3-verify)

---

## Información General

**mTLS** (Mutual TLS) es un método de autenticación basado en la verificación mutua de certificados de cliente y servidor.

Este método proporciona un alto nivel de confianza y seguridad, ya que el inicio de sesión en el sistema solo es posible si el usuario posee un certificado válido firmado por una Autoridad de Certificación (CA) de confianza.

**mTLS** es particularmente útil para sistemas corporativos o sensibles donde se requiere minimizar el riesgo de acceso no autorizado.

### Flujo de trabajo de mTLS

1. **Inicio de la conexión:** El cliente envía una solicitud al servidor de **Encvoy ID**.
2. **Solicitud de certificado de cliente:** El servidor requiere que se proporcione un certificado de cliente.
3. **Envío del certificado de cliente:** El cliente proporciona su certificado firmado por una CA de confianza.
4. **Verificación del certificado en el servidor:**
   - El servidor verifica el certificado contra la CA raíz.
   - Comprueba la fecha de expiración, la firma y el cumplimiento de los requisitos de seguridad.

5. **Autenticación de usuario:**
   - Si el certificado es válido, el servidor lo asocia con la cuenta de usuario y concede el acceso.
   - Si el certificado es inválido o no se encuentra, se deniega el acceso.

6. **Establecimiento de un canal seguro:** Tras la verificación exitosa del certificado, se establece una **conexión cifrada** y el usuario obtiene acceso.

---

## Configuración de la autenticación mTLS para administradores de Encvoy ID

Para que **mTLS** funcione, debe:

- configurar el servidor web **Nginx** para aceptar solo solicitudes firmadas por un certificado de confianza;
- crear y activar el proveedor **mTLS** en la interfaz de **Encvoy ID**;
- instalar certificados de cliente en los dispositivos de los usuarios.

### Paso 1. Configurar Nginx para mTLS { #step-1-configure-nginx-for-mtls }

Antes de añadir el proveedor en **Encvoy ID**, debe preparar la configuración de **Nginx**:

1. Abra el archivo de configuración `nginx.local.conf`.
2. Añada un nuevo bloque `server`:

   **Ejemplo de configuración**:

   ```nginx
   server {
      server_name local.trusted.com;
      listen 3443 ssl;

      # Certificados del servidor
      ssl_certificate         certs/local.trusted.com.pem;
      ssl_certificate_key     certs/local.trusted.com-key.pem;

      # Certificado CA raíz para la verificación del certificado del cliente
      ssl_client_certificate  certs/ca-bundle.crt;
      ssl_verify_client on;
      ssl_verify_depth 3;

      # Configuración de sesión y protocolos
      ssl_session_timeout 10m;
      ssl_session_cache shared:SSL:10m;
      ssl_protocols TLSv1.2 TLSv1.3;

      # Restringir el acceso a la ruta principal, mTLS solo permitido para /api/mtls
      location / {
          return 404 "mTLS endpoints only. Use port 443 for regular access.";
      }

      # Configuración de proxy para el backend
      location /api/mtls {
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;

          # Pasar información del certificado del cliente
          proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
          proxy_set_header X-SSL-Client-DN $ssl_client_s_dn;
          proxy_set_header X-SSL-Client-Serial $ssl_client_serial;
          proxy_set_header X-SSL-Client-Fingerprint $ssl_client_fingerprint;
          proxy_set_header X-SSL-Client-Issuer $ssl_client_i_dn;

          # Redirección al backend
          proxy_pass http://backend;
          proxy_redirect off;
      }
   }
   ```

3. Reinicie **Nginx** después de realizar los cambios.

#### Descripción de parámetros

| Parámetro                         | Propósito                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| `ssl_certificate`                 | Certificado del servidor utilizado para HTTPS.                   |
| `ssl_certificate_key`             | Clave privada del servidor.                                      |
| `ssl_client_certificate`          | Certificado CA raíz para verificar certificados de cliente.      |
| `ssl_verify_client on`            | Habilita la verificación obligatoria del certificado de cliente. |
| `ssl_verify_depth`                | Profundidad máxima de la cadena de verificación del certificado. |
| `ssl_session_timeout`             | Tiempo de vida de la sesión SSL.                                 |
| `ssl_protocols`                   | Versiones de TLS permitidas.                                     |
| `proxy_set_header X-SSL-Client-*` | Pasa la información del certificado del cliente al backend.      |

- Coloque los certificados del servidor (`.pem` y clave) y la CA raíz (`ca-bundle.crt`) en un directorio conveniente, por ejemplo, `certs/`.
- Especifique la ruta a los certificados en la configuración de **Nginx**.

### Paso 2. Crear el proveedor mTLS { #step-2-create-mtls-provider }

1. Vaya al Panel de Administración → pestaña **Configuración**.

   > 💡 Para crear un método de inicio de sesión para una organización, abra el **Panel de la Organización**. Si el método es para una aplicación específica, abra la **Configuración de esa aplicación**.

2. Busque el bloque **Métodos de inicio de sesión** y haga clic en **Configurar**.
3. En la ventana que se abre, haga clic en el botón **Crear** ![Botón Crear](./images/button-create.webp "Botón Crear").
4. Se abrirá una ventana con una lista de plantillas.
5. Seleccione la plantilla **mTLS**.
6. Complete el formulario de creación:

   **Información Básica**
   - **Nombre** — El nombre que verán los usuarios.
   - **Descripción** (opcional) — Una breve descripción.
   - **Logotipo** (opcional) — Puede subir su propio icono o se usará el predeterminado.

   **Configuración Adicional**
   - **Método de inicio de sesión público** — Active esto para que el método de inicio de sesión pueda añadirse al perfil de usuario como un [identificador de servicio externo](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Público** — Establezca el nivel de publicidad predeterminado para el identificador de servicio externo en el perfil de usuario.

7. Haga clic en **Crear**.

Tras la creación exitosa, el nuevo método de inicio de sesión aparecerá en la lista general de proveedores.

### Paso 3. Añadir el proveedor mTLS al widget { #step-3-add-mtls-to-widget }

Para que los usuarios vean el botón **mTLS** en el formulario de autorización, debe activar esta función en la configuración del widget:

1. Busque el método de inicio de sesión creado en la lista general de proveedores.
2. Active el interruptor en el panel del proveedor.

> **Verificación**: Después de guardar, abra el formulario de inicio de sesión en una aplicación de prueba. Debería aparecer un nuevo botón con el logotipo de **mTLS** en el widget.

---

## Vinculación de un certificado de cliente para usuarios de Encvoy ID

> 📌 Esta instrucción está destinada a los usuarios que necesitan iniciar sesión en el sistema a través de **mTLS**.

### Paso 1. Instalar el certificado de cliente en el navegador { #step-1-install-client-certificate }

Antes de la instalación, asegúrese de tener un archivo de certificado en formato `.p12` o `.pfx`.

Este archivo debe contener:

- su certificado personal,
- la clave privada,
- y la cadena de confianza (si es necesaria).

#### Instalación en Google Chrome / Microsoft Edge

1. Abra el navegador **Chrome** o **Edge**.
2. Vaya a **Configuración** → **Privacidad y seguridad**.
3. Busque la sección **Seguridad**.
4. Haga clic en **Gestionar certificados**.
5. Vaya a la pestaña **Personal** / **Sus certificados**.
6. Haga clic en **Importar...**.
7. En el Asistente de importación, haga clic en **Siguiente**.
8. Haga clic en **Examinar** y seleccione su archivo `.p12` o `.pfx`.
9. Introduzca la contraseña que recibió con el certificado.
10. Seleccione **Colocar todos los certificados en el siguiente almacén**.
11. Haga clic en **Examinar** y seleccione **Personal**.
12. Haga clic en **Siguiente** → **Finalizar**.
13. Si aparece una advertencia de seguridad, haga clic en **Sí**.

Tras la instalación exitosa, el certificado aparecerá en la lista de la pestaña **Personal** / **Sus certificados**.

#### Instalación en Mozilla Firefox

1. Abra el menú de **Firefox** → **Ajustes**
2. Vaya a la sección **Privacidad y seguridad**
3. Desplácese hasta **Certificados**
4. Haga clic en **Ver certificados...**
5. Vaya a la pestaña **Sus certificados**
6. Haga clic en **Importar...**
7. Seleccione su archivo `.p12` o `.pfx`
8. Introduzca la contraseña del certificado
9. Haga clic en **Aceptar**

Tras la instalación exitosa, el certificado aparecerá en la lista de la pestaña **Sus certificados**.

> ⚠️ Los certificados solo deben instalarse en dispositivos de confianza y la contraseña debe mantenerse estrictamente segura.

> 💡 Después de instalar el certificado, al iniciar sesión mediante **mTLS**, el navegador le pedirá automáticamente que seleccione el certificado adecuado para la autenticación.

### Paso 2. Añadir el identificador al perfil { #step-2-add-identifier-to-profile }

1. Vaya a su **Perfil**.
2. Haga clic en **Agregar** en el bloque **Identificadores**.

<img src="./images/personal-profile-12.webp" alt="Bloque de identificadores en el perfil de usuario" style="max-width:600px; width:100%">

3. En la ventana que se abre, seleccione el método de inicio de sesión **mTLS**.
4. Seleccione el certificado instalado en el paso anterior.

> 💡 **Consejo**: Si el identificador ya está vinculado a otro usuario, debe eliminarlo del perfil de ese usuario antes de vincularlo a la nueva cuenta.

### Paso 3. Verificar { #step-3-verify }

1. Vaya a la página de inicio de sesión con el método **mTLS** habilitado.
2. Seleccione el icono del método de inicio de sesión **mTLS**.
   - **Primer inicio de sesión**: el sistema puede pedirle que seleccione un certificado de cliente.
   - **Inicios de sesión posteriores**: la autenticación se realiza automáticamente utilizando el certificado seleccionado previamente.

---

## Ver también

- [Métodos de inicio de sesión y configuración del widget](./docs-06-github-en-providers-settings.md) — guía sobre métodos de inicio de sesión y configuración del widget de acceso.
- [Gestión de la organización](./docs-09-common-mini-widget-settings.md) — guía sobre el trabajo con organizaciones en el sistema **Encvoy ID**.
- [Perfil personal y gestión de permisos de aplicaciones](./docs-12-common-personal-profile.md) — guía sobre la gestión de su perfil personal.
