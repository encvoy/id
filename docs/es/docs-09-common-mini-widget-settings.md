---
title: "Encvoy ID Mini-widget — Configuración y Personalización"
description: "Aprenda a conectar y configurar el mini-widget de Encvoy ID: botones de inicio de sesión, perfil de usuario y estilos personalizados. Integre la solución en su proyecto."
keywords:
  - Encvoy ID mini-widget
  - integración de mini-widget
  - personalización de mini-widget
  - estilo de botón de inicio de sesión
author: "Equipo de Encvoy ID"
date: 2025-12-12
updated: 2025-12-12
product: [box, github, service]
region: [ru, en]
menu_title: "Configuración del Mini-widget"
order: 10
---

# Cómo configurar y conectar el mini-widget de Encvoy ID

En esta guía, aprenderá a conectar y configurar el mini-widget de **Encvoy ID** en su recurso web. Aprenderá a establecer los parámetros de autenticación, la visualización del perfil de usuario, los botones de inicio de sesión y los menús, así como a personalizar la apariencia del widget para que armonice con el diseño de su proyecto.

**Tabla de contenidos:**

- [¿Qué es un mini-widget?](#what-is-mini-widget)
- [Configuración del Widget](#widget-configuration)
- [Ajustes de visualización del perfil](#profile-display-settings)
- [Ajustes del botón de inicio de sesión](#login-button-settings)
- [Parámetros de los botones del menú](#menu-button-parameters)
- [Estilo del Mini-widget](#mini-widget-styling)
- [Estilo individual de los botones del menú](#individual-menu-button-styling)
- [Vea también](#see-also)

---

## ¿Qué es un mini-widget? { #what-is-mini-widget }

Un **mini-widget** es un menú que contiene datos del usuario y funciones esenciales. Proporciona acceso al perfil, al panel de administración, a las organizaciones o pequeña oficina, y al cierre de sesión del sistema. También puede colocar una aplicación aquí para un acceso rápido. El widget se abre al hacer clic en el avatar del usuario en la esquina superior derecha de la pantalla.

El mini-widget es un componente JavaScript ligero para la autenticación de usuarios en el servicio **Encvoy ID**. Funciona basado en los estándares OIDC/OAuth2 y PKCE y puede integrarse en cualquier sitio web o interfaz, desde HTML simple hasta SPAs en React o Vue.

> 💡 Para añadir una aplicación al mini-widget, active el interruptor **Mostrar en el mini-widget** en la [configuración de la aplicación](./docs-10-common-app-settings.md).

Ejemplos de widget:

<img src="./images/mini-widget-01.webp" alt="Ejemplo de diseño de mini-widget en Encvoy ID" style="max-width:600px; width:100%">

---

## Configuración del Widget { #widget-configuration }

### Parámetros requeridos

Para el funcionamiento básico del widget, se deben especificar tres parámetros clave:

| Parámetro     | Tipo     | Descripción                                     | Ejemplo                         |
| ------------- | -------- | ----------------------------------------------- | ------------------------------- |
| `appId`       | `string` | Identificador único de la aplicación en Trusted | `"MTnOOTdx85FgNbOFy2nUsH"`      |
| `backendUrl`  | `string` | URL de su API de backend                        | `"http://localhost:3001"`       |
| `redirectUrl` | `string` | URL para redirección tras la autorización       | `"http://localhost:3000/login"` |

### Parámetros opcionales

Existen parámetros opcionales disponibles para una configuración avanzada:

| Parámetro             | Tipo                  | Descripción                              | Valor por defecto             |
| --------------------- | --------------------- | ---------------------------------------- | ----------------------------- |
| `issuer`              | `string`              | URL del servidor Trusted SSO             | `"https://id.kloud.one"`      |
| `withOutHomePage`     | `boolean`             | Redirección automática a la autorización | `false`                       |
| `getTokenEndPoint`    | `string`              | Endpoint para obtener un token           | `"/api/oidc/token"`           |
| `getUserInfoEndPoint` | `string`              | Endpoint para obtener datos del usuario  | `"/api/oidc/me"`              |
| `scopes`              | `string[]`            | Permisos OAuth2                          | `["openid", "lk", "profile"]` |
| `profile`             | `IProfileConfig`      | Ajustes del perfil de usuario            | Ver sección abajo             |
| `loginButton`         | `ICustomMenuButton`   | Ajustes del botón de inicio de sesión    | Ver sección abajo             |
| `menuButtons`         | `ICustomMenuButton[]` | Array de botones adicionales             | Ver sección abajo             |
| `customStyles`        | `ICustomStyles`       | Estilos globales del widget              | Ver sección abajo             |

### Ejemplo de conexión básica

```typescript
import { TrustedWidget, TrustedWidgetConfig } from "trusted-widget";

const newConfig: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  issuer: "https://id.kloud.one",
  withOutHomePage: false,
  getTokenEndPoint: "/api/oidc/token",
  getUserInfoEndPoint: "/api/oidc/me",
};

// Uso del componente
<TrustedWidget config={newConfig} />;
```

---

## Ajustes de visualización del perfil { #profile-display-settings }

### Parámetros de configuración del perfil

El **Perfil de Usuario** es un componente que contiene el avatar y el nombre de usuario.

| Parámetro    | Tipo               | Descripción                                      | Valor por defecto     |
| ------------ | ------------------ | ------------------------------------------------ | --------------------- |
| `isHideText` | `boolean`          | Ocultar la visualización del nombre de usuario   | `false`               |
| `wrapper`    | `IComponentStyles` | Estilos del contenedor del perfil (solo colores) | Ver sección de estilo |
| `button`     | `IComponentStyles` | Estilos del botón del avatar (solo colores)      | Ver sección de estilo |

> ⚠️ **Importante:** Para los ajustes del perfil (`profile.wrapper` y `profile.button`), solo se pueden cambiar los colores (`color.text`, `color.background`, `color.hover`) y se puede ocultar el nombre de usuario (`isHideText`). Otros parámetros de estilo (como `borderRadius`, `padding`, `position`) no se aplican al perfil.

### Ejemplo de configuración del perfil

```typescript
// Ejemplo: Solo avatar sin texto
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  profile: {
    isHideText: true, // Ocultar nombre, mostrar solo avatar
  },
};
```

---

## Ajustes del botón de inicio de sesión { #login-button-settings }

El botón de inicio de sesión se muestra para usuarios no autorizados. Puede personalizar su texto, icono y estilos.

### Parámetros del botón de inicio de sesión

| Parámetro      | Tipo                           | Descripción                         | Valor por defecto     |
| -------------- | ------------------------------ | ----------------------------------- | --------------------- |
| `text`         | `string`                       | Texto del botón de inicio de sesión | `"Login"`             |
| `type`         | `string`                       | Tipo de botón                       | `"login"`             |
| `icon`         | `string \| React.ReactElement` | Enlace de imagen o elemento React   | `null`                |
| `customStyles` | `IComponentStyles`             | Estilos individuales para el botón  | Ver sección de estilo |

### Ejemplo de configuración

```typescript
// Ejemplo: Botón con icono personalizado
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  loginButton: {
    text: "Login via Trusted",
    type: "login",
    icon: "https://id.kloud.one/favicon.ico", // Icono personalizado
  },
};
```

```typescript
// Ejemplo: Botón de texto simple sin icono
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  loginButton: {
    text: "Login",
    type: "login",
    customStyles: {
      isHideIcon: true, // Ocultar icono
    },
  },
};
```

---

## Parámetros de los botones del menú { #menu-button-parameters }

### Parámetros requeridos

| Parámetro | Tipo     | Descripción                  | Ejemplo              |
| --------- | -------- | ---------------------------- | -------------------- |
| `text`    | `string` | Nombre del botón mostrado    | `"TestService"`      |
| `link`    | `string` | URL de la página a la que ir | `"https://test.com"` |

### Parámetros opcionales

| Parámetro      | Tipo                           | Descripción                        | Valor por defecto     |
| -------------- | ------------------------------ | ---------------------------------- | --------------------- |
| `icon`         | `string \| React.ReactElement` | Enlace de imagen o elemento React  | `null`                |
| `customStyles` | `IComponentStyles`             | Estilos individuales para el botón | Ver sección de estilo |

### Ejemplo de configuración

```typescript
import { TrustedWidget, TrustedWidgetConfig } from "trusted-widget";

const newConfig: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  menuButtons: [
    {
      text: "TestService",
      link: "https://test.com",
      icon: "https://image.png", // | <Icon />
    },
  ],
};
```

---

## Estilo del Mini-widget { #mini-widget-styling }

El widget admite una personalización detallada de la apariencia a través del objeto `customStyles`. Puede controlar colores, radios de borde, rellenos y alineación para todos los elementos.

### Estructura del objeto de estilo

```typescript
customStyles: {
  global: {
    borderRadius: "8px",        // Radio de borde global
    color: { /* colores */ }      // Colores globales
  },
  components: {
    primaryButton: { /* estilos */ },   // Botones primarios
    secondaryButton: { /* estilos */ }, // Botones secundarios
    accountButton: { /* estilos */ }    // Botones del menú de cuenta
  }
}
```

### Parámetros de estilo personalizados

#### Estilos globales

| Parámetro             | Tipo               | Descripción                               | Ejemplo   |
| --------------------- | ------------------ | ----------------------------------------- | --------- |
| `global.borderRadius` | `string`           | Radio de esquina para todos los elementos | `"12px"`  |
| `global.color`        | `IComponentStyles` | Colores globales                          | Ver abajo |

#### Estilos de componentes

| Parámetro                    | Tipo               | Descripción                       | Propósito                   |
| ---------------------------- | ------------------ | --------------------------------- | --------------------------- |
| `components.primaryButton`   | `IComponentStyles` | Estilo de botón primario          | Botón "Login", "Profile"    |
| `components.secondaryButton` | `IComponentStyles` | Estilo de botón secundario        | Botón "Logout"              |
| `components.accountButton`   | `IComponentStyles` | Estilo de botón de menú de cuenta | Botones en menú desplegable |

#### Parámetros de estilo de componente IComponentStyles

| Parámetro          | Tipo                 | Descripción                       | Ejemplo      |
| ------------------ | -------------------- | --------------------------------- | ------------ |
| `color.text`       | `string`             | Color de texto e icono (HEX)      | `"#ffffff"`  |
| `color.background` | `string`             | Color de fondo (HEX)              | `"#1976d2"`  |
| `color.hover`      | `string`             | Color de fondo al pasar (HEX)     | `"#1565c0"`  |
| `borderRadius`     | `string`             | Radio de esquina del elemento     | `"8px"`      |
| `padding`          | `string`             | Relleno interno                   | `"8px 16px"` |
| `position`         | `"left" \| "center"` | Alineación del contenido en botón | `"center"`   |
| `isHideIcon`       | `boolean`            | Ocultar icono en botón            | `false`      |

#### Herencia de estilos

El widget cuenta con un sistema inteligente de herencia de estilos para el `secondaryButton`:

- **Si los estilos se establecen solo para `primaryButton`**, se aplican automáticamente al `secondaryButton`, pero con mayor transparencia (mediante opacidad reducida).
- **Si se establecen estilos separados para `secondaryButton`**, no se aplica transparencia; solo se utilizan los parámetros especificados explícitamente.

### Ejemplo de configuración de estilo

#### Ejemplo de configuración de estilo global

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Valores por defecto para estilos globales
  customStyles: {
    global: {
      color: {
        text: "#666666",
        background: "#ffffff",
      },
      borderRadius: "8px",
    },
    components: {
      accountButton: {
        color: {
          text: "#fff",
          background: "#efefef",
          hover: undefined, // si no se establece, se aplica filter: brightness(90%)
        },
        position: "left",
        isHideIcon: false,
      },
      primaryButton: {
        color: {
          text: "#ffffff",
          background: "#b5262f",
          hover: undefined, // si no se establece, se aplica filter: brightness(90%)
        },
        position: "left",
        isHideIcon: false,
      },
      // secondaryButton no establecido — se usará el estilo de primaryButton con transparencia (opacity:0.5)
    },
  },
};
```

#### Ejemplo de configuración de estilo completa

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Ajustes de perfil
  profile: {
    isHideText: false,
    wrapper: {
      color: {
        text: "#333333",
        background: "#f8f9fa",
      },
    },
    button: {
      color: {
        text: "#333333",
        background: "transparent",
        hover: "rgba(0, 0, 0, 0.08)",
      },
    },
  },
};
```

#### Ejemplo de configuración completa con botón de inicio de sesión

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Botón de inicio de sesión con icono
  loginButton: {
    text: "Login",
    type: "login",
    icon: "https://id.kloud.one/favicon.ico",
    customStyles: {
      color: {
        text: "#ffffff",
        background: "#4CAF50",
        hover: "#45a049",
      },
      borderRadius: "8px",
      padding: "10px 20px",
    },
  },
};
```

#### Ejemplo de configuración completa con estilos globales y menú

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Estilos globales
  customStyles: {
    global: {
      borderRadius: "8px",
    },
    components: {
      primaryButton: {
        color: {
          text: "#ffffff",
          background: "#4CAF50",
          hover: "#45a049",
        },
        position: "center",
        isHideIcon: false,
      },
      secondaryButton: {
        color: {
          text: "#4CAF50",
          background: "transparent",
          hover: "#f1f8e9",
        },
        position: "center",
        isHideIcon: false,
      },
      accountButton: {
        color: {
          text: "#333333",
          background: "#ffffff",
          hover: "#f5f5f5",
        },
        position: "left",
        isHideIcon: false,
      },
    },
  },
};
```

---

## Estilo individual de los botones del menú { #individual-menu-button-styling }

Para cada botón en `menuButtons`, puede establecer estilos individuales a través de la propiedad `customStyles` de tipo `IComponentStyles`.

### Ejemplo con estilos de botón individuales

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  menuButtons: [
    {
      text: "Personal Account",
      link: "https://my-account.com",
      icon: "https://icons.com/profile.png",
      customStyles: {
        color: {
          text: "#ffffff",
          background: "#4CAF50", // Fondo verde
          hover: "#45a049", // Verde oscuro al pasar
        },
        borderRadius: "8px",
        padding: "8px 16px",
        position: "center",
      },
    },
    {
      text: "Settings",
      link: "https://settings.com",
      icon: "https://icons.com/settings.png",
      customStyles: {
        color: {
          text: "#333333",
          background: "#f5f5f5", // Fondo gris claro
          hover: "#e0e0e0", // Gris al pasar
        },
        borderRadius: "6px",
        padding: "6px 12px",
        position: "left",
      },
    },
    {
      text: "Support",
      link: "https://support.com",
      customStyles: {
        color: {
          text: "#ffffff",
          background: "#FF5722", // Fondo naranja
          hover: "#E64A19", // Naranja oscuro al pasar
        },
        borderRadius: "4px",
        padding: "10px 20px",
        position: "center",
        isHideIcon: true, // Ocultar icono para este botón
      },
    },
  ],
};
```

### Prioridad de aplicación de estilos

1. **Estilos de botón individuales** (`customStyles` en el objeto del botón) — prioridad más alta
2. **Estilos de accountButton** (`customStyles.components.accountButton`) — si no se establecen estilos individuales
3. **Estilos por defecto** — si los anteriores no están establecidos

```typescript
const config: TrustedWidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Si un botón NO tiene customStyles, se aplican los estilos de accountButton a menuButtons
  customStyles: {
    components: {
      // estilos por defecto de accountButton
      accountButton: {
        color: {
          text: "#666666",
          background: "#efefef",
          hover: undefined, // si no se establece, se aplica filter: brightness(90%)
        },
        position: "left",
      },
    },
  },
};
```

### Principios de estilo del Mini-widget

| Principio                                       | Qué significa                                                                                       | Cómo aplicarlo                                                                                                                                                                                                               |
| :---------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gestión Centralizada**                        | Todos los ajustes de apariencia se definen mediante tres objetos de configuración clave.            | Configure el aspecto general en `customStyles`, el perfil en `profile` y el botón de inicio de sesión en `loginButton`.                                                                                                      |
| **Configuración Flexible del Perfil**           | La apariencia del bloque con el nombre y avatar del usuario autorizado se configura por separado.   | Use `profile.wrapper` para el fondo y `profile.button` para el botón del avatar. Tenga en cuenta que aquí solo funcionan los ajustes de color.                                                                               |
| **Configuración del Botón de Inicio de Sesión** | Los estilos para el botón que ven los usuarios no autorizados se configuran de forma independiente. | Defina el texto, el icono y los estilos en el objeto `loginButton` y su propiedad `customStyles`.                                                                                                                            |
| **Estructura de Color**                         | El esquema de color para cualquier elemento se describe de manera uniforme.                         | Use siempre un objeto `color` anidado con los campos `text`, `background` y `hover` (ej. `color: {text: "#fff", background: "#1976d2"}`).                                                                                    |
| **Gestión de Visualización**                    | Las etiquetas de texto o los iconos se pueden ocultar fácilmente.                                   | Use los indicadores `isHideText` (ocultar texto) e `isHideIcon` (ocultar icono) en los estilos de los componentes.                                                                                                           |
| **Alineación Flexible**                         | El contenido dentro de los botones se puede alinear a la izquierda o al centro.                     | Establezca la propiedad `position: "left"` o `position: "center"` en los estilos del botón deseado.                                                                                                                          |
| **Herencia Inteligente**                        | El sistema llena los vacíos de configuración utilizando valores lógicos por defecto.                | - Para `secondaryButton`: si no se establecen estilos, hereda de `primaryButton` con transparencia añadida.<br>- Para `hover`: si no se especifica el color, se aplica `filter: brightness(90%)` al fondo al pasar el ratón. |
| **Sistema de Respaldo (Fallback)**              | Los botones del menú desplegable utilizan estilos generales si no se establecen los individuales.   | Si un botón en `menuButtons` carece de su propio `customStyles`, se aplican automáticamente los estilos de `accountButton`.                                                                                                  |
| **Radio de Borde Global**                       | Se puede establecer un único valor de radio de esquina para todos los elementos del widget.         | Especifique `customStyles.global.borderRadius` (ej. `"8px"`), y afectará a los botones y ventanas modales.                                                                                                                   |
| **Personalización Individual**                  | Cualquier botón del menú puede tener un estilo completamente único.                                 | Añada un objeto `customStyles` para un elemento específico en el array `menuButtons`.                                                                                                                                        |

---

## Vea también { #see-also }

- [Gestión de Aplicaciones](./docs-10-common-app-settings.md) — guía para crear, configurar y gestionar aplicaciones OAuth 2.0 y OpenID Connect (OIDC).
- [Gestión de Organizaciones](./docs-11-common-org-settings.md) — guía para trabajar con organizaciones en **Encvoy ID**.
- [Gestión del Perfil Personal y Permisos de Aplicaciones](./docs-12-common-personal-profile.md) — guía para gestionar su perfil personal.
