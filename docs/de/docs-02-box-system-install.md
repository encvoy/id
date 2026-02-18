---
title: "Installation von Encvoy ID via Docker — SSO-Bereitstellung"
description: "Installieren Sie Encvoy ID via Docker: Anforderungen, Konfiguration und erster Login. Schritt-für-Schritt-SSO-Bereitstellung für Administratoren und DevOps."
keywords:
  - Encvoy ID installieren
  - Installation Encvoy ID
  - SSO-System Bereitstellung
  - Encvoy ID deployen
  - Docker Installation Encvoy ID
  - Docker Compose Encvoy ID
  - Enterprise SSO-System
author: "Encvoy ID Team"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Installation und erster Start"
order: 2
---

# So installieren Sie Encvoy ID

In dieser Anleitung erfahren Sie, wie Sie das **Encvoy ID** SSO-System via Docker auf Ihrem Server installieren. Wir führen Sie durch den gesamten Prozess — von der Vorbereitung der Umgebung bis zum ersten Login des Administrators.

**Inhalt:**

- [Installationsanforderungen](#installation-requirements)
- [Installation von Docker und Docker Compose](#install-docker-and-docker-compose)
- [Installation des SSO-Systems](#install-sso-system)
- [Erster Login](#first-login)
- [Siehe auch](#see-also)

---

## Installationsanforderungen { #installation-requirements }

### Systemanforderungen für den Server

Stellen Sie vor der Installation des **Encvoy ID** Systems sicher, dass Ihre Infrastruktur die Anforderungen erfüllt.

Die Systemanforderungen hängen von der geplanten Last ab. Eine Minimalkonfiguration reicht für Testumgebungen aus, während für Produktionsumgebungen die empfohlenen Parameter verwendet werden sollten.

#### Minimale Konfiguration

| Komponente                | Anforderungen  |
| ------------------------- | -------------- |
| **RAM**                   | 4 GB           |
| **Festplattenspeicher**   | 50 GB SSD      |
| **Prozessor (CPU)**       | 2 Kerne x86_64 |
| **Netzwerkschnittstelle** | 1 Gbps         |

#### Empfohlene Konfiguration

| Komponente                | Anforderungen    |
| ------------------------- | ---------------- |
| **RAM**                   | 8 GB oder mehr   |
| **Festplattenspeicher**   | 100 GB SSD/NVMe  |
| **Prozessor (CPU)**       | 4+ Kerne x86_64  |
| **Netzwerkschnittstelle** | 1 Gbps und höher |

> 💡 **Tipp:** Für hochlastige Systeme mit Tausenden von Benutzern wird empfohlen: <br>
>
> - 16+ GB RAM<br>
> - 8+ CPU-Kerne<br>
> - NVMe-Laufwerke für maximale Datenbankleistung

### Softwareanforderungen

#### Software

| Komponente         | Unterstützte Versionen                                                                          | Zusätzliche Informationen                        |
| ------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Betriebssystem** | Ubuntu 18.04 LTS (Bionic Beaver), <br> Ubuntu 20.04 LTS (Focal Fossa),<br> Debian 11 (Bullseye) | Jede Linux-Distribution mit Docker-Unterstützung |
| **Docker Engine**  | 19.03+                                                                                          | -                                                |
| **Docker Compose** | 1.27+                                                                                           | -                                                |
| **Nginx/Apache**   | Jede moderne Version                                                                            | -                                                |

#### Allgemeine Anforderungen

Für eine erfolgreiche Installation und den korrekten Betrieb von **Encvoy ID** müssen mehrere Bedingungen erfüllt sein:

- Ein Server mit einer statischen IP-Adresse.
- Zugriff auf alle Workstations über den Port, der für den Zugriff auf das System verwendet wird.
- Verfügbarkeit eines E-Mail-Servers (SMTP-Server).
- Die Verbindung zum Dienst muss über das HTTPS-Protokoll hergestellt werden.

---

## Installation von Docker und Docker Compose { #install-docker-and-docker-compose }

**Encvoy ID** wird als Satz von Docker-Containern bereitgestellt und kann als Enterprise OAuth 2.0 Authorization Server und OpenID Connect Provider (IdP) verwendet werden.

> 📚 [Docker Dokumentation](https://docs.docker.com/engine/install/)

### Schritt 1. Installation der Docker Engine

**Für Ubuntu/Debian:**

```bash
# Pakete aktualisieren
sudo apt update && sudo apt upgrade -y

# Abhängigkeiten installieren
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Docker GPG-Schlüssel hinzufügen
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Repository hinzufügen
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Installation überprüfen
sudo docker --version
```

**Für CentOS/RHEL:**

```bash
# yum-utils installieren
sudo yum install -y yum-utils

# Docker Repository hinzufügen
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Docker installieren
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Docker starten und aktivieren
sudo systemctl start docker
sudo systemctl enable docker

# Installation überprüfen
sudo docker --version
```

### Schritt 2. Installation von Docker Compose

```bash
# Docker Compose herunterladen
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Ausführungsrechte setzen
sudo chmod +x /usr/local/bin/docker-compose

# Installation überprüfen
docker-compose --version
```

> 💡 Versionsanforderungen: **Docker Engine 20.10+** und **Docker Compose 1.29+**. Verwenden Sie `docker --version` und `docker-compose --version` zur Überprüfung.

---

## Installation des SSO-Systems { #install-sso-system }

### Schritt 1. Vorbereitung des Arbeitsverzeichnisses

Erstellen Sie das Installationsverzeichnis und wechseln Sie dorthin:

```bash
# Verzeichnis erstellen
mkdir trusted-id && cd trusted-id

# Aktuellen Pfad prüfen
pwd  # Sollte anzeigen: /home/ihr_benutzer/trusted-id
```

### Schritt 2. Herunterladen der Konfigurationsdateien

Laden Sie die erforderlichen Konfigurationsdateien herunter:

```bash
# Hauptdateien herunterladen
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/docker-compose.yaml
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/nginx.conf
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/build.sh
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/.env

# Download überprüfen
ls -la
```

**Heruntergeladene Dateien:**

| Datei                   | Zweck                                |
| ----------------------- | ------------------------------------ |
| **docker-compose.yaml** | Docker-Container-Konfiguration       |
| **nginx.conf**          | Nginx Webserver-Einstellungen        |
| **build.sh**            | Setup- und Build-Skript              |
| **.env**                | Umgebungsvariablen und Einstellungen |

### Schritt 3. Berechtigungen setzen

Machen Sie das Build-Skript ausführbar:

```bash
# Berechtigungen für das Build-Skript setzen
chmod +x ./build.sh

# Berechtigungen überprüfen
ls -l build.sh
```

> ⚙️ Nach der Installation wird empfohlen, eine Basiskonfiguration durchzuführen. Eine detaillierte Beschreibung aller Parameter finden Sie im Abschnitt [Encvoy ID Umgebungsvariablen](./docs-03-box-system-configuration.md).

### Schritt 4. Konfiguration der Einstellungen

Bearbeiten Sie die Datei `.env` mit den Haupteinstellungen:

```bash
# Datei zum Bearbeiten öffnen (nano oder vim verwenden)
nano .env
```

**Erforderliche Einstellungen:**

```env
# Hauptdomain des Systems
ID_HOST=id.example.com  # Ersetzen Sie dies durch Ihre Domain oder IP

# Administrator-E-Mail
ADMIN_MAIL=beispiel@mail.com  # Ersetzen Sie dies durch eine echte E-Mail
```

### Schritt 5. Ausführen des Build-Skripts

Führen Sie das Setup-Skript aus:

```bash
./build.sh
```

Als Ergebnis wird der Wert der Variable **ID_HOST** in die Datei **nginx.conf** geschrieben, und die Variablen **CLIENT_ID** und **CLIENT_SECRET** werden in die Datei **.env** geschrieben.

### Schritt 6. Starten des Systems

Starten Sie das Projekt:

```bash
docker compose up -d
```

### Nützliche Docker Compose Befehle

| Befehl            | Beschreibung                | Anwendungsbeispiel       |
| ----------------- | --------------------------- | ------------------------ |
| **Logs anzeigen** | Logs in Echtzeit überwachen | `docker compose logs -f` |
| **Stoppen**       | Alle Container stoppen      | `docker compose stop`    |
| **Starten**       | Gestoppte Container starten | `docker compose start`   |
| **Neustarten**    | Alle Container neu starten  | `docker compose restart` |
| **Status**        | Container-Status anzeigen   | `docker compose ps`      |

---

## Erster Login { #first-login }

### Standard-Administrator-Zugangsdaten

Nach der Installation wird ein Administratorkonto mit **Administrator**-Rechten erstellt:

- **Login** — `root`,
- **Passwort** — `changethis`,
- **Rolle** — **Administrator**.

> 📌 Diese Zugangsdaten bieten vollen Zugriff auf das System. Ändern Sie das Passwort unbedingt sofort nach dem ersten Login.

### Erster Login

Um auf die **Encvoy ID** Weboberfläche zuzugreifen, navigieren Sie zu: `https://ID_HOST`.

1. Geben Sie im ersten Schritt des Login-Widgets den Login ein und klicken Sie auf **Anmelden**.
2. Geben Sie im zweiten Schritt das Passwort ein und klicken Sie auf **Anmelden**.

Nach der Autorisierung werden Sie zum [Profil](./docs-12-common-personal-profile.md) des Benutzers weitergeleitet.

### Zugriff auf das Admin-Panel { #admin-panel-access }

Die Administrationseinstellungen befinden sich im Admin-Panel.

So greifen Sie auf das Panel zu:

1. Klicken Sie auf Ihren Namen in der oberen rechten Ecke des Fensters.
2. Klicken Sie im sich öffnenden Mini-Widget auf den Dienstnamen **Encvoy ID**.
3. Sie werden zum **Admin-Panel** weitergeleitet.

---

## Siehe auch { #see-also }

- [Encvoy ID Systembeschreibung](./docs-01-box-about.md) — Übersicht über die Funktionen von **Encvoy ID**.
- [Encvoy ID Umgebungsvariablen](./docs-03-box-system-configuration.md) — Leitfaden zur Vorbereitung der Konfiguration vor dem Start.
- [Systemkonfiguration](./docs-04-box-system-settings.md) — Leitfaden zur Konfiguration der Benutzeroberfläche und des Benutzerzugriffs auf das System.
