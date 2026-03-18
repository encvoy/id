# Encvoy ID

**[English](../README.md)** | **[Español](README-es.md)** | **[Italiano](README-it.md)** | **Français** | **[Deutsch](README-de.md)**

---

**Gestion des identités et des accès (IAM) gratuite et open-source pour les organisations modernes.**

[![docs](https://img.shields.io/badge/docs-current-green)](https://id.encvoy.es/docs)
[![website](https://img.shields.io/badge/website-encvoy.es-green)](https://encvoy.es)
[![email](https://img.shields.io/badge/email-contact-blue)](mailto:contact@encvoy.es)
[![Follow](https://img.shields.io/twitter/follow/encvoylab?style=social)](https://x.com/EncvoyLab)

Plateforme open-source de gestion des identités et des accès (IAM) fournissant une authentification sécurisée, une autorisation et un Single Sign-On (SSO) pour les applications modernes.

Encvoy ID permet aux organisations de gérer les identités, d'authentifier les utilisateurs et de contrôler l'accès aux services à l'aide de standards de sécurité modernes tels qu'OpenID Connect (OIDC) et OAuth 2.0.

<img width="1904" height="640" alt="ENCVOYID" src="../ENCVOYID.png" />

Il est conçu pour fonctionner comme fournisseur d'identité central pour les applications, les API, les outils internes et les plateformes SaaS.

---
## Sommaire

- [Pourquoi Encvoy ID](#pourquoi-encvoy-id)
- [Capacités Principales](#-capacités-principales)
- [Standards Pris en Charge](#-standards-pris-en-charge)
- [Architecture](#-architecture)
- [Audit et Surveillance](#-audit-et-surveillance)
- [État du Projet](#-état-du-projet)
- [Cas d'Usage](#-cas-dusage)
- [Sécurité](#-sécurité)
- [Déploiement](#-déploiement)
- [Open Source](#-open-source)
- [Démarrage Rapide](#-démarrage-rapide)
- [Documentation](#-documentation)

## Pourquoi Encvoy ID

Les systèmes modernes nécessitent une gestion des identités sécurisée et flexible.

Encvoy ID offre :
- Gestion centralisée des identités
- Authentification sécurisée
- Single Sign-On entre les applications
- Intégration flexible avec les systèmes modernes
- Prise en charge de l'authentification sans mot de passe

La plateforme peut être utilisée comme alternative auto-hébergée aux solutions IAM commerciales.

---

## ✨ Capacités Principales

### Gestion des identités

- Répertoire centralisé des utilisateurs
- Gestion du cycle de vie des identités
- Groupes et rôles d'utilisateurs
- Contrôle d'accès basé sur les rôles (RBAC)

### Authentification

Encvoy ID prend en charge un large éventail de méthodes d'authentification, y compris des options sans mot de passe et résistantes au phishing.

#### Méthodes standard

- Nom d'utilisateur et mot de passe
- Connexion par e-mail

#### Méthodes fortes et sans mot de passe

- WebAuthn / Passkeys
- mTLS (certificats client)
- Mots de passe à usage unique TOTP / HOTP

### Fournisseurs d'identité externes

Encvoy ID peut s'intégrer à des fournisseurs d'identité externes tels que :

- Google
- GitHub
- Autres fournisseurs OpenID Connect

Plusieurs facteurs d'authentification peuvent être combinés pour mettre en place une **authentification multi-facteurs (MFA)**.

---

## 📜 Standards Pris en Charge

- OpenID Connect (OIDC)
- OAuth 2.0
- WebAuthn
- TOTP / HOTP
- TLS mutuel (mTLS)

---

## 🏗 Architecture

Encvoy ID est construit comme une plateforme modulaire composée de plusieurs services.

| Composant | Description |
|---|---|
| Backend | Service IAM principal |
| OIDC | Fournisseur OpenID Connect |
| Dashboard | Interface d'administration |
| Auth | Service d'authentification |
| Widget-auth | Widget d'authentification pour les applications |

Cette architecture permet à la plateforme de monter en charge et de s'intégrer à différents environnements.

---

## 📊 Audit et Surveillance

Encvoy ID fournit une journalisation détaillée des événements d'authentification et de l'activité des utilisateurs.

Les fonctionnalités incluent :

- Journaux des événements d'authentification
- Suivi de l'activité des utilisateurs
- Surveillance de la sécurité
- Enregistrements prêts pour l'audit de conformité

---

## 🚧 État du Projet

Encvoy ID est un projet open-source activement développé.

De nouvelles fonctionnalités et améliorations sont ajoutées en continu.
Les retours et contributions de la communauté sont les bienvenus.

## 💼 Cas d'Usage

Encvoy ID peut être utilisé pour :

- Plateforme d'identité centrale pour les organisations
- SSO pour les services internes
- Authentification pour les plateformes SaaS
- Fournisseur d'identité pour les API
- Authentification des microservices
- Connexion centralisée pour plusieurs applications

---

## 🔐 Sécurité

Encvoy ID est conçu selon des principes de sécurité avant tout.

Les fonctionnalités de sécurité incluent :

- Authentification résistante au phishing
- Connexion sans mot de passe
- Authentification sécurisée basée sur des tokens
- Application centralisée des politiques
- Journalisation d'audit détaillée

---

## 🌍 Déploiement

Encvoy ID peut être déployé dans différents environnements :

- Infrastructure sur site
- Cloud privé ou public
- Environnements hybrides

---

## 🌱 Open Source

Encvoy ID est gratuit et open-source.

Les organisations peuvent l'utiliser, le modifier et le déployer librement.
Les contributions de la communauté sont les bienvenues.

---

## 🚀 Démarrage Rapide

- [Démarrage rapide](README-qs-fr.md)

## 📚 Documentation

- [Documentation](../docs/fr/SUMMARY-github-fr.md)

---

© Encvoy Lab
