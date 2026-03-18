# Encvoy ID

**English** | **[Español](/locale/README-es.md)** | **[Italiano](/locale/README-it.md)** | **[Français](/locale/README-fr.md)** | **[Deutsch](/locale/README-de.md)**

---

**Free and open-source Identity and Access Management (IAM) for modern organizations.**

[![docs](https://img.shields.io/badge/docs-current-green)](https://id.encvoy.es/docs)
[![website](https://img.shields.io/badge/website-encvoy.es-green)](https://encvoy.es)
[![email](https://img.shields.io/badge/email-contact-blue)](mailto:contact@encvoy.es)
[![Follow](https://img.shields.io/twitter/follow/encvoylab?style=social)](https://x.com/EncvoyLab)

Open-source Identity and Access Management (IAM) platform providing secure authentication, authorization, and Single Sign-On (SSO) for modern applications.

Encvoy ID allows organizations to manage identities, authenticate users, and control access to services using modern security standards such as OpenID Connect (OIDC) and OAuth 2.0.

<img width="1904" height="640" alt="ENCVOYID" src="ENCVOYID.png" />

It is designed to work as a central identity provider for applications, APIs, internal tools, and SaaS platforms.

---
## Contents

- [Why Encvoy ID](#why-encvoy-id)
- [Core Capabilities](#-core-capabilities)
- [Supported Standards](#-supported-standards)
- [Architecture](#-architecture)
- [Audit & Monitoring](#-audit--monitoring)
- [Project Status](#-project-status)
- [Use Cases](#-use-cases)
- [Security](#-security)
- [Deployment](#-deployment)
- [Open Source](#-open-source)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)

## Why Encvoy ID

Modern systems require secure and flexible identity management.

Encvoy ID provides:
- Centralized identity management
- Secure authentication
- Single Sign-On across applications
- Flexible integration with modern systems
- Support for passwordless authentication

The platform can be used as a self-hosted alternative to commercial IAM solutions.

---

## ✨ Core Capabilities

### Identity Management

- Centralized user directory
- Identity lifecycle management
- User groups and roles
- Role-Based Access Control (RBAC)

### Authentication

Encvoy ID supports a wide range of authentication methods,
including passwordless and phishing-resistant options.

#### Standard methods

- Username and password
- Email-based login

#### Strong and passwordless methods

- WebAuthn / Passkeys
- mTLS (client certificates)
- TOTP / HOTP one-time passwords

### External identity providers

Encvoy ID can integrate with external identity providers such as:

- Google
- GitHub
- Other OpenID Connect providers

Multiple authentication factors can be combined to implement **Multi-Factor Authentication (MFA)**.

---

## 📜 Supported Standards

- OpenID Connect (OIDC)
- OAuth 2.0
- WebAuthn
- TOTP / HOTP
- Mutual TLS (mTLS)

---

## 🏗 Architecture

Encvoy ID is built as a modular platform composed of several services.

| Component | Description |
|---|---|
| Backend | Core IAM service |
| OIDC | OpenID Connect provider |
| Dashboard | Administration interface |
| Auth | Authentication service |
| Widget-auth | Authentication widget for applications |

This architecture allows the platform to scale and integrate with different environments.

---

## 📊 Audit & Monitoring

Encvoy ID provides detailed logging of authentication events and user activity.

Features include:

- Authentication event logs
- User activity tracking
- Security monitoring
- Audit-ready records for compliance

---

## 🚧 Project Status

Encvoy ID is an actively developed open-source project.

New features and improvements are continuously being added.
Community feedback and contributions are welcome.

## 💼 Use Cases

Encvoy ID can be used for:

- Central identity platform for organizations
- SSO for internal services
- Authentication for SaaS platforms
- API identity provider
- Microservice authentication
- Centralized login for multiple applications

---

## 🔐 Security

Encvoy ID is designed with security-first principles.

Security features include:

- Phishing-resistant authentication
- Passwordless login
- Secure token-based authentication
- Centralized policy enforcement
- Detailed audit logging

---

## 🌍 Deployment

Encvoy ID can be deployed in different environments:

- On-premise infrastructure
- Private or public cloud
- Hybrid environments

---

## 🌱 Open Source

Encvoy ID is free and open-source.

Organizations can use, modify, and deploy it freely.
Community contributions are welcome.

---

## 🚀 Quick Start

- [Quick start](README-qs.md)

## 📚 Documentation

- [Documentation](./docs/en/SUMMARY-github-en.md)

---

© Encvoy Lab
