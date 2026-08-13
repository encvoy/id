---
title: "{{projectName}} SSO-System für Unternehmensauthentifizierung"
description: "{{projectName}} ist ein SSO-System für Unternehmen für Single Sign-On mit OAuth 2.0, OpenID Connect und 2FA. Erfahren Sie, wie Sie eine zentrale Authentifizierung implementieren."
keywords:
  - SSO-System
  - SSO-System für Unternehmen
  - Single Sign-On
  - Einmalanmeldung
  - Identity Provider (IdP)
  - OAuth 2.0
  - OpenID Connect (OIDC)
  - OAuth 2.0 Provider
  - OpenID Connect Provider
  - zentrale Authentifizierung
  - Unternehmensauthentifizierung
  - Zwei-Faktor-Authentifizierung (2FA)
  - Unternehmensanwendungen
  - OIDC-Autorisierung
  - OAuth-Autorisierung
  - SSO-Integration
  - vertrauenswürdige Provider
author: "{{projectName}} Team"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Systemübersicht"
order: 1
---

# Übersicht über {{projectName}} — Single Sign-On (SSO) System

**{{projectName}}** ist ein Single Sign-On (SSO) System für die zentrale Benutzerauthentifizierung und Zugriffsverwaltung für Unternehmensanwendungen.

Das System bietet eine sichere zentrale Authentifizierung mit Unterstützung für SSO, OAuth 2.0, OpenID Connect und Zwei-Faktor-Authentifizierung.

---

## Anwendungsfälle für {{projectName}}

**{{projectName}}** ist ein System zur Organisation der zentralen Benutzeranmeldung bei Informationsressourcen des Unternehmens unter Verwendung eines einzigen Kontos.

**{{projectName}}** richtet sich an Unternehmen, die Folgendes benötigen:

- **Ein zentrales Anmeldefenster** für interne und externe Dienste
- **Zentrale Zugriffsverwaltung** für verschiedene Benutzerkategorien (Mitarbeiter, Auftragnehmer, Kunden)
- **Erhöhte Sicherheit** durch Unterstützung der Multi-Faktor-Authentifizierung
- **Strikte Kontrolle und Prüfung** von Benutzeraktionen
- **Sichere Integration** mehrerer Anwendungen mit unterschiedlichen Authentifizierungssystemen

---

## Hauptmerkmale von {{projectName}}

### 1. Authentifizierung und Anmeldung

Das System bietet eine zentrale Authentifizierung und unterstützt mehrere Protokolle und Authentifizierungsmethoden.

#### Unterstützte Protokolle

- **OpenID Connect (OIDC)** — Benutzerauthentifizierung und Übertragung von Identitätsdaten
- **OAuth 2.0** — Autorisierung und Verwaltung des Ressourcenzugriffs

#### Authentifizierungsmethoden

- **Basismethoden**: Login und Passwort, E-Mail
- **Externe Identity Provider**: Soziale Netzwerke, vertrauenswürdige Unternehmenssysteme und andere Dienste
- **Erweiterte und passwortlose Methoden:** Kryptografische Authentifizierung über **mTLS** (Client-Zertifikate) und **WebAuthn** (Biometrie, Hardware-Keys) sowie **TOTP/HOTP** Einmalpasswörter.

#### Zwei-Faktor-Authentifizierung (2FA / MFA)

**{{projectName}}** unterstützt Multi-Faktor-Authentifizierung (MFA), bei der der Zugriff erst nach erfolgreicher Überprüfung der Benutzeridentität durch mehrere unabhängige Faktoren (Wissen, Besitz, Biometrie) gewährt wird.

### 2. Anwendungs- und Benutzerverwaltung

- **Erstellung und Konfiguration von Anwendungen:** Webanwendungen, native mobile Anwendungen
- **Widget-Anpassung:** Branding des externen Authentifizierungs-Widgets entsprechend dem Unternehmensstil
- **Benutzerverwaltung:** Registrierung, Bearbeitung, Sperrung, Passwortänderungen

### 3. Sicherheit und Audit

- **Differenzierung von Zugriffsrechten**
- **Detaillierte Protokollierung** aller Ereignisse und Aktionen

### 4. Mini-Widget

Eine leichtgewichtige JavaScript-Komponente, die schnellen Zugriff auf Authentifizierungsfunktionen und Benutzerinformationen bietet. Es lässt sich einfach in beliebige Websites und Schnittstellen einbetten und ermöglicht Übergänge zum Profil, zum Organisations-Dashboard und zu Anwendungen.

### Zugriffsebenen

Das System bietet ein flexibles rollenbasiertes Zugriffsmodell:

| Rolle                                                           | Berechtigungen                                                            | Vorgesehen für                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| **Service Administrator**    | Voller Zugriff auf alle Anwendungen, Benutzer und globale Einstellungen   | Systemadministratoren, Superuser          |
| **Manager**             | Verwaltung von Anwendungen und Anmeldemethoden für ihre Organisation/Einheit | Abteilungsleiter, Projektmanager          |
| **Application Administrator** | Verwaltung spezifischer Anwendungen und ihrer Benutzer                    | Entwickler, Anwendungsadministratoren     |
| **Mitglied**              | Verwaltung des eigenen Profils und der Zugriffsberechtigungen für Daten   | Reguläre Benutzer, Mitarbeiter            |

### {{projectName}} Systemmodule

#### 1. Profil

Das Modul "Profil" ermöglicht die Verwaltung persönlicher Benutzerdaten und Zugriffseinstellungen. Es umfasst Funktionen zur Bearbeitung persönlicher Informationen, Datenschutzeinstellungen, Verwaltung von Anwendungsberechtigungen und Einsicht in das Aktivitätenprotokoll. Das Modul bietet zudem Zugriff auf den öffentlichen Anwendungskatalog.

#### 2. Admin-Dashboard

Das Modul "Admin-Dashboard" ist für die zentrale Verwaltung des **{{projectName}}**-Systems konzipiert. Es umfasst Funktionen zur Konfiguration globaler Systemparameter, Authentifizierungsmethoden und des Erscheinungsbilds der Anmeldeseite. In diesem Modul können Sie Anwendungen und Benutzerkonten verwalten sowie deren Aktivitäten über ein einheitliches Ereignisprotokoll überwachen.

#### 3. Organisations-Dashboard

Das Modul "Organisations-Dashboard" ermöglicht die Verwaltung von Anwendungen, Authentifizierungsmethoden und Zugriffsrichtlinien innerhalb einer Organisation. Es umfasst Einstellungen für Organisationsparameter, Konfiguration von Anmeldemethoden, Verwaltung von Organisationsanwendungen und Überwachung der Benutzeraktivitäten.

#### 4. Anwendungs-Dashboard (ADM)

Das Modul "Anwendungs-Dashboard" ist für die Administration einzelner Anwendungen vorgesehen. Es enthält Funktionen zur Verwaltung zugewiesener Anwendungen und zur Überwachung der Aktivitäten von Benutzern, die Zugriff auf diese Anwendungen haben.

---

## Konzept und Funktionsprinzipien von {{projectName}}

### Allgemeines Interaktionsschema

<img src="./images/interaction-scheme.drawio.png" alt="Allgemeines Interaktionsschema von {{projectName}} mit Unternehmenssystemen" style="max-width:700px; width:100%">

**Interaktionssequenz:**

1. **Zugriffsanfrage** — der Benutzer greift auf das Informationssystem (IS) zu.
2. **Prüfung in IS-DB** — das System prüft, ob der Benutzer existiert.
3. **Weiterleitung zum Widget** — der Benutzer wird zu **{{projectName}}** geleitet.
4. **Authentifizierung** — der Benutzer durchläuft den Anmeldevorgang.
5. **Prüfung in {{projectName}}-DB** — Validierung der Anmeldedaten.
6. **Profilbereitstellung** — Rückgabe der Benutzerdaten.
7. **Mapping im IS** — Suche nach dem Benutzer basierend auf den Daten von **{{projectName}}**.
8. **Rechteprüfung** — Autorisierung im Zielsystem.
9. **Zugriff gewährt** — erfolgreiche Anmeldung im System.

> 📌 **Integrationsanforderungen:** Um ein Informationssystem an **{{projectName}}** anzubinden, sind eine Benutzerdatenbank und ein Autorisierungsmodul erforderlich, das OpenID Connect oder OAuth 2.0 unterstützt.

### OpenID Connect Autorisierungsschema

<img src="./images/oidc-authorization-scheme.drawio.png" alt="OpenID Connect Autorisierungsschema" style="max-width:700px; width:100%">

**Wichtige OIDC-Phasen:**

1. Benutzer greift auf das IS zu.
2. IS (Client) generiert `code_verifier` und `code_challenge`.
3. IS leitet den Benutzer zu `/authorize` in **{{projectName}}** weiter.
4. Benutzer wird zum **{{projectName}}** Autorisierungs-Widget weitergeleitet.
5. Benutzer gibt Login/Passwort ein und stimmt der Datenübertragung zu.
6. Benutzerüberprüfung erfolgt in der **{{projectName}}** DB.
7. Benutzer wird mit einem `Authorization code` zurück zum IS (Client) geleitet.
8. IS sendet eine Anfrage an `/token` in **{{projectName}}**.
9. Verifizierung von `code_challenge` und `code_verifier` in **{{projectName}}**.
10. Bereitstellung des `id token` mit dem **{{projectName}}** Benutzerprofil und des `access token` (optional `refresh token`) an das IS.
11. IS-Benutzerauthentifizierung.
12. Benutzer erhält Zugriff auf das IS.

### OAuth 2.0 Autorisierungsschema

<img src="./images/oauth-authorization-scheme.drawio.png" alt="OAuth 2.0 Autorisierungsschema" style="max-width:700px; width:100%">

**Besonderheiten des OAuth 2.0 Flows:**

1. Benutzer greift auf das IS zu.
2. IS leitet den Benutzer zu `/authorize` in **{{projectName}}** weiter.
3. Benutzer wird zum **{{projectName}}** Autorisierungs-Widget weitergeleitet.
4. Benutzer gibt Login/Passwort ein und stimmt der Datenübertragung zu.
5. Benutzerüberprüfung erfolgt in der **{{projectName}}** DB.
6. **{{projectName}}** leitet den Benutzer mit einem `Authorization code` an die `Redirect_URI` des IS zurück.
7. IS sendet eine Anfrage für einen `token` unter Verwendung des `Authorization code`.
8. **{{projectName}}** validiert die Anfrage.
9. **{{projectName}}** gibt `id token` und `access token` zurück (optional `refresh token`).
10. IS fordert das Benutzerprofil an.
11. **{{projectName}}** stellt das Benutzerprofil bereit.
12. IS validiert die Antworten und erstellt eine lokale Benutzersitzung.
13. Benutzer erhält Zugriff auf das IS.

### Single Sign-On (SSO) Schema

<img src="./images/sso-scheme.drawio.png" alt="Funktionsweise von Single Sign-On zwischen mehreren Systemen" style="max-width:400px; width:100%">

**Typisches Szenario:**

1. Zugriffsanfrage an IS1.
2. Benutzerauthentifizierung in **{{projectName}}**.
3. Bereitstellung des **{{projectName}}** Benutzerprofils an IS1.
4. Zugriffsanfrage an IS2.
5. Bereitstellung des **{{projectName}}** Benutzerprofils an IS2, ohne den Authentifizierungsvorgang zu wiederholen.

> 🚀 **Bereit zum Start?** Fahren Sie mit der [Installationsanleitung](./docs-02-box-system-install.md) fort.

---

## Siehe auch

- [Installation des {{projectName}} Systems](./docs-02-box-system-install.md) — eine Anleitung zur Installation des Systems.
- [{{projectName}} Umgebungsvariablen](./docs-03-box-system-configuration.md) — eine Anleitung zur Vorbereitung der Konfiguration vor dem Start.
- [Systemkonfiguration](./docs-04-box-system-settings.md) — eine Anleitung zur Konfiguration der Benutzeroberfläche und des Benutzerzugriffs auf das System.