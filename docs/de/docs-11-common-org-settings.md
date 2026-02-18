---
title: "Encvoy ID Organisation — Verwaltung und Zugriffskonfiguration"
description: "Erfahren Sie, wie Sie eine Organisation in Encvoy ID einrichten: Erstellung, Branding, Zugriffsverwaltung, Anmeldemethoden und Prüfung der Benutzeraktivitäten."
keywords:
  - Encvoy ID Organisation
  - Encvoy ID Organisations-Dashboard
  - Organisationseinstellungen
  - Organisations-Anmeldemethoden
  - Organisations-Zugriffsverwaltung
  - Organisations-Branding
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Verwaltung Ihrer Organisation"
order: 6
---

# Verwaltung einer Organisation in Encvoy ID

In **Encvoy ID** dienen Organisationen als primäre Struktureinheit für die Verwaltung des Anwendungszugriffs, die Unterteilung von Mitarbeitern nach Abteilungen und die Pflege von Audits der Benutzeraktivitäten. In diesem Leitfaden behandeln wir, wie Sie Organisationen erstellen und Anmeldemethoden konfigurieren.

**Inhaltsverzeichnis:**

- [Grundlagen der Organisation](#organization-basics)
- [Zugriff auf das Organisations-Dashboard](#organization-panel-access)
- [Konfiguration von Organisationsname und Logo](#organization-name-and-logo)
- [Organisations-Anmeldemethoden](#organization-login-methods)
- [Siehe auch](#see-also)

---

## Grundlagen der Organisation { #organization-basics }

Eine Organisation in **Encvoy ID** ist eine Struktureinheit, die es Ihnen ermöglicht:

- **Zugriffe zu trennen** auf Anwendungen zwischen Abteilungen oder Projekten,
- **Unternehmens-Anmeldemethoden zu konfigurieren**,
- **Zentralisiertes Auditing** der Benutzeraktivitäten zu führen,
- **Anwendungen zu verwalten** innerhalb eines einzigen Unternehmens,
- **Branding zu konfigurieren** (Logo, Name) für Login-Widgets.

> 💡 **Anwendungsfall:** Organisationen sind ideal für Unternehmen, die mehrere Anwendungen und Benutzergruppen von einem zentralen Kontrollpunkt aus verwalten müssen.

---

## Zugriff auf das Organisations-Dashboard { #organization-panel-access }

Das Organisations-Dashboard ist für die Verwaltung von Organisationseinstellungen, Anwendungen und Benutzern konzipiert.

Die folgenden Abschnitte sind im Organisations-Dashboard verfügbar:

- **Einstellungen** — Organisationsparameter, Anmeldemethoden und Anpassung des Login-Widgets.
- **Anwendungen** — Verwaltung der Organisationsanwendungen.
- **Protokoll** — Historie der Benutzeraktivitäten in der Organisation.

### So greifen Sie auf das Encvoy ID Organisations-Dashboard zu

> ⚠️ Um auf das Organisations-Dashboard zuzugreifen, müssen Sie über **Manager**-Berechtigungen verfügen. Wenden Sie sich an Ihren Service-Administrator, um diese zu erhalten.

So öffnen Sie das Organisations-Dashboard:

1. Melden Sie sich in Ihrem persönlichen **Encvoy ID**-Konto an.
2. Klicken Sie auf Ihren Namen in der oberen rechten Ecke des Fensters.
3. Klicken Sie im sich öffnenden Mini-Widget-Fenster auf den Namen Ihrer Organisation.

<img src="./images/org-settings-01.webp" alt="Auswahl einer Organisation im Encvoy ID Mini-Widget" style="max-width:300px; width:100%">

Sie werden zum **Organisations-Dashboard** weitergeleitet.

> 💡 Fügen Sie häufig verwendete Anwendungen zum Mini-Widget hinzu, indem Sie die Einstellung **Im Mini-Widget anzeigen** für den Schnellzugriff verwenden. <br>
> <img src="./images/org-settings-02.webp" alt="Konfiguration der Anwendungsanzeige im Encvoy ID Mini-Widget" style="max-width:300px; width:100%">

## Konfiguration von Organisationsname und Logo { #organization-name-and-logo }

Der Name und das Logo werden sowohl in der Benutzeroberfläche des **Encvoy ID**-Systems als auch im Mini-Widget angezeigt.

So konfigurieren Sie Name und Logo:

1. Gehen Sie zum Organisations-Dashboard → Registerkarte **Einstellungen**.
2. Erweitern Sie den Block **Basisinformationen**.
3. Geben Sie den neuen Namen im Feld **Anwendungsname** ein.
4. Klicken Sie im Abschnitt **Anwendungslogo** auf **Hochladen** und wählen Sie die Logodatei aus.

   > ⚡ Unterstützte Formate: JPG, GIF, PNG, WEBP; maximale Größe 1 MB.

5. Passen Sie den Anzeigeberich des Logos an.

<img src="./images/settings-main-info-02.webp" alt="Konfiguration der Basisinformationen der Organisation in Encvoy ID" style="max-width:400px; width:100%">

6. Klicken Sie auf **Speichern**.

---

## Organisations-Anmeldemethoden { #organization-login-methods }

Eine **Anmeldemethode** ist ein Benutzerauthentifizierungsverfahren, das es ermöglicht, sich bei Anwendungen anzumelden.

Eine Organisation kann sowohl öffentliche Anmeldemethoden als auch speziell für diese Organisation erstellte Anmeldemethoden verwenden.

**Sie können:**

- **Öffentliche Anmeldemethoden** verwenden, die vom **Encvoy ID**-Administrator konfiguriert wurden
- **Eigene Anmeldemethoden** exklusiv für Ihre Organisation hinzufügen
- **Sichtbarkeit** konfigurieren — bestimmen Sie, wo Ihre Anmeldemethoden verfügbar sein werden
- Identifikatoren für Benutzer **verpflichtend** machen

> ⚠️ **Einschränkungen:** Nur **Encvoy ID**-Administratoren können öffentliche Anmeldemethoden bearbeiten.

> 🔍 Detaillierte Anweisungen zum Erstellen, Bearbeiten und Löschen von Anmeldemethoden finden Sie im Hauptleitfaden: [Konfigurieren von Anmeldemethoden](./docs-06-github-en-providers-settings.md#managing-login-methods).

---

## Siehe auch { #see-also }

- [Anmeldemethoden und Konfiguration des Login-Widgets](./docs-06-github-en-providers-settings.md) — ein Leitfaden zu Anmeldemethoden und zur Einrichtung des Login-Widgets.
- [Anwendungsverwaltung](./docs-10-common-app-settings.md) — ein Leitfaden zum Erstellen, Konfigurieren und Verwalten von OAuth 2.0- und OpenID Connect (OIDC)-Anwendungen.
- [Persönliches Profil und Verwaltung von Anwendungsberechtigungen](./docs-12-common-personal-profile.md) — ein Leitfaden zur Verwaltung Ihres persönlichen Profils.
