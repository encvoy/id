# Encvoy ID

**[English](../README.md)** | **[Español](README-es.md)** | **[Italiano](README-it.md)** | **[Français](README-fr.md)** | **Deutsch**

---

**Kostenloses Open-Source-Identity-and-Access-Management (IAM) für moderne Organisationen.**

[![docs](https://img.shields.io/badge/docs-current-green)](https://id.encvoy.es/docs)
[![website](https://img.shields.io/badge/website-encvoy.es-green)](https://encvoy.es)
[![email](https://img.shields.io/badge/email-contact-blue)](mailto:contact@encvoy.es)
[![Follow](https://img.shields.io/twitter/follow/encvoylab?style=social)](https://x.com/EncvoyLab)

Open-Source-Plattform für Identity and Access Management (IAM), die sichere Authentifizierung, Autorisierung und Single Sign-On (SSO) für moderne Anwendungen bereitstellt.

Encvoy ID ermöglicht Organisationen die Verwaltung von Identitäten, die Authentifizierung von Benutzern und die Steuerung des Zugriffs auf Dienste mithilfe moderner Sicherheitsstandards wie OpenID Connect (OIDC) und OAuth 2.0.

<img width="1904" height="640" alt="ENCVOYID" src="../ENCVOYID.png" />

Es ist darauf ausgelegt, als zentraler Identitätsanbieter für Anwendungen, APIs, interne Werkzeuge und SaaS-Plattformen zu fungieren.

---
## Inhalt

- [Warum Encvoy ID](#warum-encvoy-id)
- [Kernfunktionen](#-kernfunktionen)
- [Unterstützte Standards](#-unterstützte-standards)
- [Architektur](#-architektur)
- [Audit und Überwachung](#-audit-und-überwachung)
- [Projektstatus](#-projektstatus)
- [Anwendungsfälle](#-anwendungsfälle)
- [Sicherheit](#-sicherheit)
- [Bereitstellung](#-bereitstellung)
- [Open Source](#-open-source)
- [Schnellstart](#-schnellstart)
- [Dokumentation](#-dokumentation)

## Warum Encvoy ID

Moderne Systeme benötigen ein sicheres und flexibles Identitätsmanagement.

Encvoy ID bietet:
- Zentralisierte Identitätsverwaltung
- Sichere Authentifizierung
- Single Sign-On über Anwendungen hinweg
- Flexible Integration in moderne Systeme
- Unterstützung für passwortlose Authentifizierung

Die Plattform kann als selbst gehostete Alternative zu kommerziellen IAM-Lösungen eingesetzt werden.

---

## ✨ Kernfunktionen

### Identitätsverwaltung

- Zentrales Benutzerverzeichnis
- Verwaltung des Identitätslebenszyklus
- Benutzergruppen und Rollen
- Rollenbasierte Zugriffskontrolle (RBAC)

### Authentifizierung

Encvoy ID unterstützt eine breite Palette von Authentifizierungsmethoden, einschließlich passwortloser und phishing-resistenter Optionen.

#### Standardmethoden

- Benutzername und Passwort
- E-Mail-basierte Anmeldung

#### Starke und passwortlose Methoden

- WebAuthn / Passkeys
- mTLS (Client-Zertifikate)
- TOTP- / HOTP-Einmalpasswörter

### Externe Identitätsanbieter

Encvoy ID kann in externe Identitätsanbieter integriert werden, zum Beispiel:

- Google
- GitHub
- Andere OpenID-Connect-Anbieter

Mehrere Authentifizierungsfaktoren können kombiniert werden, um **Multi-Faktor-Authentifizierung (MFA)** umzusetzen.

---

## 📜 Unterstützte Standards

- OpenID Connect (OIDC)
- OAuth 2.0
- WebAuthn
- TOTP / HOTP
- Mutual TLS (mTLS)

---

## 🏗 Architektur

Encvoy ID ist als modulare Plattform aufgebaut, die aus mehreren Diensten besteht.

| Komponente | Beschreibung |
|---|---|
| Backend | Kern-IAM-Dienst |
| OIDC | OpenID-Connect-Anbieter |
| Dashboard | Administrationsoberfläche |
| Auth | Authentifizierungsdienst |
| Widget-auth | Authentifizierungs-Widget für Anwendungen |

Diese Architektur ermöglicht der Plattform Skalierung und Integration in unterschiedliche Umgebungen.

---

## 📊 Audit und Überwachung

Encvoy ID bietet eine detaillierte Protokollierung von Authentifizierungsereignissen und Benutzeraktivitäten.

Dazu gehören:

- Protokolle von Authentifizierungsereignissen
- Nachverfolgung von Benutzeraktivitäten
- Sicherheitsüberwachung
- Audit-fähige Nachweise für Compliance

---

## 🚧 Projektstatus

Encvoy ID ist ein aktiv entwickeltes Open-Source-Projekt.

Neue Funktionen und Verbesserungen werden kontinuierlich hinzugefügt.
Feedback und Beiträge aus der Community sind willkommen.

## 💼 Anwendungsfälle

Encvoy ID kann eingesetzt werden für:

- Zentrale Identitätsplattform für Organisationen
- SSO für interne Dienste
- Authentifizierung für SaaS-Plattformen
- Identitätsanbieter für APIs
- Authentifizierung in Microservices
- Zentralisierte Anmeldung für mehrere Anwendungen

---

## 🔐 Sicherheit

Encvoy ID wurde nach dem Prinzip Security First entwickelt.

Zu den Sicherheitsfunktionen gehören:

- Phishing-resistente Authentifizierung
- Passwortlose Anmeldung
- Sichere tokenbasierte Authentifizierung
- Zentralisierte Richtliniendurchsetzung
- Detaillierte Audit-Protokollierung

---

## 🌍 Bereitstellung

Encvoy ID kann in verschiedenen Umgebungen bereitgestellt werden:

- On-Premises-Infrastruktur
- Private oder öffentliche Cloud
- Hybride Umgebungen

---

## 🌱 Open Source

Encvoy ID ist kostenlos und Open Source.

Organisationen können es frei nutzen, modifizieren und bereitstellen.
Community-Beiträge sind willkommen.

---

## 🚀 Schnellstart

- [Schnellstart](README-qs-de.md)

## 📚 Dokumentation

- [Dokumentation](../docs/de/SUMMARY-github-de.md)

---

© Encvoy Lab
