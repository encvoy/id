---
title: "Variables de entorno Encvoy ID — Referencia del administrador"
description: "Aprenda a configurar correctamente las variables de entorno de Encvoy ID y garantice un funcionamiento seguro del sistema. Una guía paso a paso para administradores."
keywords:
  - variables de entorno Encvoy ID
  - configurar env Encvoy ID
  - variables env OIDC
  - variables de entorno OpenID Connect
  - configuración de entorno OAuth 2.0
  - docker-compose env
  - configuración PostgreSQL Encvoy ID
  - configuración SMTP Encvoy ID
  - personalización de interfaz Encvoy ID
  - CUSTOM_STYLES Encvoy ID
  - seguridad de variables de entorno
  - administrador Encvoy ID
  - configuración del servidor Encvoy ID
  - guía de configuración Encvoy ID
  - métricas Google Encvoy ID
author: "Equipo de Encvoy ID"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Configuración de variables de entorno"
order: 3
---

# Cómo configurar las variables de entorno de Encvoy ID

En esta guía, aprenderá a configurar las variables de entorno para **Encvoy ID** en su servidor. Desglosaremos todos los parámetros en detalle — desde la base de datos y OIDC hasta la caché, el correo y la interfaz — para asegurar que su sistema funcione correctamente desde el primer lanzamiento.

**Tabla de contenidos:**

- [Cómo configurar las variables de entorno de Encvoy ID](#cómo-configurar-las-variables-de-entorno-de-encvoy-id)
  - [Variables de entorno comunes { #common-environment-variables }](#variables-de-entorno-comunes--common-environment-variables-)
  - [Variables de entorno de la base de datos (PostgreSQL) { #database-environment-variables }](#variables-de-entorno-de-la-base-de-datos-postgresql--database-environment-variables-)
  - [Redis, Sesiones y Cookies OIDC { #redis-sessions-and-oidc-cookies }](#redis-sesiones-y-cookies-oidc--redis-sessions-and-oidc-cookies-)
  - [Limitación de tasa y registros { #rate-limiting-and-logging }](#limitación-de-tasa-y-registros--rate-limiting-and-logging-)
  - [Correo y notificaciones { #mail-and-notifications }](#correo-y-notificaciones--mail-and-notifications-)
  - [Personalización de la interfaz { #interface-customization }](#personalización-de-la-interfaz--interface-customization-)
  - [Permisos y licencias { #permissions-and-licenses }](#permisos-y-licencias--permissions-and-licenses-)
  - [Métricas { #metrics }](#métricas--metrics-)
  - [Ver también { #see-also }](#ver-también--see-also-)

> 💡 Para cambiar las variables de entorno, debe realizar los cambios en el archivo **docker-compose.yml**.

---

## Variables de entorno comunes { #common-environment-variables }

Estas variables definen el comportamiento básico e identificación del servicio.

| Variable                    | Descripción                                                          | Valor por defecto           |
| --------------------------- | -------------------------------------------------------------------- | --------------------------- |
| `NODE_ENV`                  | Entorno de ejecución de la aplicación (`development` o `production`) | `production`                |
| `DOMAIN`                    | Dominio del servicio                                                 | —                           |
| `ADMIN_LOGIN`               | Login del administrador                                              | `root`                      |
| `ADMIN_PASSWORD`            | Contraseña del administrador                                         | `changethis`                |
| `DELETE_PROFILE_AFTER_DAYS` | Número de días tras los cuales se eliminará un perfil de usuario     | `30`                        |
| `CLIENT_ID`                 | Identificador único de la aplicación (se recomienda UUID)            | —                           |
| `CLIENT_SECRET`             | Secreto único de la aplicación (se recomienda UUID)                  | —                           |
| `MANUAL_URL`                | Enlace a la documentación para los usuarios                          | `https://your-domain/docs/` |

> ⚠️ Las variables `CLIENT_ID` y `CLIENT_SECRET` se utilizan para identificar a **Encvoy ID** como un cliente OAuth 2.0 / OpenID Connect y deben mantenerse en secreto.

---

## Variables de entorno de la base de datos (PostgreSQL) { #database-environment-variables }

Parámetros para la conexión a la base de datos PostgreSQL.

| Variable            | Descripción                                       | Valor por defecto |
| ------------------- | ------------------------------------------------- | ----------------- |
| `POSTGRES_USER`     | Nombre de usuario para la conexión PostgreSQL     | `user`            |
| `POSTGRES_PASSWORD` | Contraseña del usuario PostgreSQL                 | `password`        |
| `POSTGRES_DB`       | Nombre de la base de datos                        | `mydb`            |
| `POSTGRES_HOST`     | Host de la base de datos                          | `localhost`       |
| `POSTGRES_PORT`     | Puerto de conexión de la base de datos            | `5432`            |
| `DATABASE_URL`      | Cadena de conexión completa en formato PostgreSQL | —                 |

---

## Redis, Sesiones y Cookies OIDC { #redis-sessions-and-oidc-cookies }

Ajustes para el almacenamiento de sesiones, caché de datos y seguridad de autenticación.

| Variable             | Descripción                             | Valor por defecto  |
| -------------------- | --------------------------------------- | ------------------ |
| `REDIS_HOST`         | Host de Redis                           | `127.0.0.1`        |
| `REDIS_PORT`         | Puerto de Redis                         | `6379`             |
| `OIDC_COOKIE_SECRET` | Secreto para firmar y verificar cookies | —                  |
| `OIDC_SESSION_TTL`   | Tiempo de vida de la sesión en segundos | `86400` (24 horas) |

---

## Limitación de tasa y registros { #rate-limiting-and-logging }

Ajustes para la protección contra abusos y control de registros.

| Variable             | Descripción                                   | Valor por defecto |
| -------------------- | --------------------------------------------- | ----------------- |
| `RATE_LIMIT`         | Número de solicitudes para limitación de tasa | `15`              |
| `RATE_LIMIT_TTL_SEC` | Período de tiempo en segundos para el límite  | `900`             |
| `CONSOLE_LOG_LEVELS` | Niveles de registro para la consola           | `log warn error`  |

---

## Correo y notificaciones { #mail-and-notifications }

Ajustes del servidor SMTP para el envío de correos electrónicos (confirmación de registro, restablecimiento de contraseña, etc.).

| Variable         | Descripción                                     | Valor por defecto | Ejemplo                                                                                              |
| ---------------- | ----------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER` | Ajustes del proveedor de correo en formato JSON | —                 | `{"hostname":"smtp.example.com","port":465,"root_mail":"admin@example.com","password":"SecretPass"}` |

---

## Personalización de la interfaz { #interface-customization }

La apariencia de los botones, enlaces y pestañas se configura mediante un objeto JSON en la variable `CUSTOM_STYLES`.

La variable `CUSTOM_STYLES` le permite personalizar la interfaz de **Encvoy ID** sin cambiar el código.

```env
# Vaya a la carpeta del proyecto
cd /home/els/nodetrustedserverconfig

# Detenga el servicio antes de realizar cambios
docker compose stop

# Edite el archivo .env
nano .env

# Ejemplo de personalización mínima
CUSTOM_STYLES=`{"palette":{"white":{"accent":"#2c5aa0","accentHover":"#1e3a6f"}},"button":{"borderRadius":"8px"}}`

# Inicie el servicio de nuevo
docker compose up -d
```

Descripción de la variable `CUSTOM_STYLES`:

| Variable        | Descripción                                                                                                                                        | Ejemplo                                                                                                                                                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CUSTOM_STYLES` | Ajustes de apariencia de la interfaz, incluyendo colores, estilos de botones y widgets. El valor debe ser estrictamente un JSON de una sola línea. | `CUSTOM_STYLES={"palette":{"white":{"accent":"#ff6f00","accentHover":"#f56b00","onAccentColor":"#fff"}},"button":{"borderRadius":"4px"},"widget":{"backgroundColor":"#ff6f00","color":"#fff","isHideText":false,"button":{"background":"#ffffff","hover":"#fadfcd","color":"#ff6f00"}},"isAccordionIconColored":true,"contentPosition":"center"}` |

| Parámetro                | Descripción                                            | Ejemplo                        |
| ------------------------ | ------------------------------------------------------ | ------------------------------ |
| `accent`                 | Color primario para elementos de acento en formato HEX | `"#ff6f00"`                    |
| `accentHover`            | Color al pasar el cursor en formato HEX                | `"#f56b00"`                    |
| `onAccentColor`          | Color del texto sobre fondo de acento en formato HEX   | `"#fff"`                       |
| `secondaryAccent`        | Color para elementos secundarios en formato HEX        | `"#fae9de"`                    |
| `borderColor`            | Color del borde para elementos en formato HEX          | `"#858BA0"`                    |
| `borderRadius`           | Redondeo de esquinas para botones (`button`)           | `4px`, `8px`, etc.             |
| `isAccordionIconColored` | Colorear iconos de acordeón                            | `true`/`false`                 |
| `contentPosition`        | Alineación del contenido                               | `"start"`, `"center"`, `"end"` |

---

## Permisos y licencias { #permissions-and-licenses }

| Variable    | Descripción                              | Valor por defecto     | Ejemplo                                |
| ----------- | ---------------------------------------- | --------------------- | -------------------------------------- |
| `COPYRIGHT` | Información de copyright en formato JSON | `{"ru":" ","en":" "}` | `{"ru":"© Компания","en":"© Company"}` |

---

## Métricas { #metrics }

| Variable            | Descripción                                 |
| ------------------- | ------------------------------------------- |
| `GOOGLE_METRICA_ID` | ID para la integración con Google Analytics |

---

## Ver también { #see-also }

- [Instalación del sistema Encvoy ID](./docs-02-box-system-install.md) — guía para la instalación del sistema.
- [Configuración del sistema](./docs-04-box-system-settings.md) — guía para configurar la interfaz y el acceso de los usuarios al sistema.
