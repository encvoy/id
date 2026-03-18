# Encvoy ID

**[English](../README.md)** | **Español** | **[Italiano](README-it.md)** | **[Français](README-fr.md)** | **[Deutsch](README-de.md)**

---

**Gestión de Identidad y Acceso (IAM) gratuita y de código abierto para organizaciones modernas.**

[![docs](https://img.shields.io/badge/docs-current-green)](https://id.encvoy.es/docs)
[![website](https://img.shields.io/badge/website-encvoy.es-green)](https://encvoy.es)
[![email](https://img.shields.io/badge/email-contact-blue)](mailto:contact@encvoy.es)
[![Follow](https://img.shields.io/twitter/follow/encvoylab?style=social)](https://x.com/EncvoyLab)

Plataforma de Gestión de Identidad y Acceso (IAM) de código abierto que ofrece autenticación segura, autorización e inicio de sesión único (SSO) para aplicaciones modernas.

Encvoy ID permite a las organizaciones gestionar identidades, autenticar usuarios y controlar el acceso a servicios mediante estándares de seguridad modernos como OpenID Connect (OIDC) y OAuth 2.0.

<img width="1904" height="640" alt="ENCVOYID" src="../ENCVOYID.png" />

Está diseñado para funcionar como proveedor central de identidad para aplicaciones, API, herramientas internas y plataformas SaaS.

---
## Contenido

- [Por qué Encvoy ID](#por-qué-encvoy-id)
- [Capacidades Principales](#-capacidades-principales)
- [Estándares Compatibles](#-estándares-compatibles)
- [Arquitectura](#-arquitectura)
- [Auditoría y Monitoreo](#-auditoría-y-monitoreo)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Casos de Uso](#-casos-de-uso)
- [Seguridad](#-seguridad)
- [Despliegue](#-despliegue)
- [Código Abierto](#-código-abierto)
- [Inicio Rápido](#-inicio-rápido)
- [Documentación](#-documentación)

## Por qué Encvoy ID

Los sistemas modernos requieren una gestión de identidad segura y flexible.

Encvoy ID ofrece:
- Gestión centralizada de identidades
- Autenticación segura
- Inicio de sesión único entre aplicaciones
- Integración flexible con sistemas modernos
- Compatibilidad con autenticación sin contraseña

La plataforma puede utilizarse como alternativa autohospedada a soluciones IAM comerciales.

---

## ✨ Capacidades Principales

### Gestión de Identidades

- Directorio centralizado de usuarios
- Gestión del ciclo de vida de la identidad
- Grupos y roles de usuario
- Control de acceso basado en roles (RBAC)

### Autenticación

Encvoy ID admite una amplia gama de métodos de autenticación, incluidas opciones sin contraseña y resistentes al phishing.

#### Métodos estándar

- Nombre de usuario y contraseña
- Inicio de sesión por correo electrónico

#### Métodos robustos y sin contraseña

- WebAuthn / Passkeys
- mTLS (certificados de cliente)
- Contraseñas de un solo uso TOTP / HOTP

### Proveedores de identidad externos

Encvoy ID puede integrarse con proveedores de identidad externos como:

- Google
- GitHub
- Otros proveedores de OpenID Connect

Se pueden combinar múltiples factores de autenticación para implementar **autenticación multifactor (MFA)**.

---

## 📜 Estándares Compatibles

- OpenID Connect (OIDC)
- OAuth 2.0
- WebAuthn
- TOTP / HOTP
- TLS mutuo (mTLS)

---

## 🏗 Arquitectura

Encvoy ID está construido como una plataforma modular compuesta por varios servicios.

| Componente | Descripción |
|---|---|
| Backend | Servicio principal de IAM |
| OIDC | Proveedor de OpenID Connect |
| Dashboard | Interfaz de administración |
| Auth | Servicio de autenticación |
| Widget-auth | Widget de autenticación para aplicaciones |

Esta arquitectura permite que la plataforma escale y se integre con distintos entornos.

---

## 📊 Auditoría y Monitoreo

Encvoy ID proporciona un registro detallado de eventos de autenticación y actividad de usuarios.

Incluye:

- Registros de eventos de autenticación
- Seguimiento de actividad de usuarios
- Monitoreo de seguridad
- Registros preparados para auditoría y cumplimiento

---

## 🚧 Estado del Proyecto

Encvoy ID es un proyecto de código abierto en desarrollo activo.

Se añaden continuamente nuevas funciones y mejoras.
Los comentarios y contribuciones de la comunidad son bienvenidos.

## 💼 Casos de Uso

Encvoy ID puede utilizarse para:

- Plataforma central de identidad para organizaciones
- SSO para servicios internos
- Autenticación para plataformas SaaS
- Proveedor de identidad para API
- Autenticación de microservicios
- Inicio de sesión centralizado para múltiples aplicaciones

---

## 🔐 Seguridad

Encvoy ID está diseñado con un enfoque de seguridad primero.

Las funciones de seguridad incluyen:

- Autenticación resistente al phishing
- Inicio de sesión sin contraseña
- Autenticación segura basada en tokens
- Aplicación centralizada de políticas
- Registro detallado para auditoría

---

## 🌍 Despliegue

Encvoy ID puede desplegarse en distintos entornos:

- Infraestructura on-premise
- Nube privada o pública
- Entornos híbridos

---

## 🌱 Código Abierto

Encvoy ID es gratuito y de código abierto.

Las organizaciones pueden usarlo, modificarlo e implementarlo libremente.
Las contribuciones de la comunidad son bienvenidas.

---

## 🚀 Inicio Rápido

- [Inicio rápido](README-qs-es.md)

## 📚 Documentación

- [Documentación](../docs/es/SUMMARY-github-es.md)

---

© Encvoy Lab
