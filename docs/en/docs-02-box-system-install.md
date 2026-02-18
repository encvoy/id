---
title: "Installing Encvoy ID via Docker — SSO Deployment"
description: "Install Encvoy ID via Docker: requirements, configuration setup, and first login. Step-by-step SSO deployment for administrators and DevOps."
keywords:
  - install Encvoy ID
  - installing Encvoy ID
  - SSO system deployment
  - deploy Encvoy ID
  - docker installation Encvoy ID
  - docker compose Encvoy ID
  - enterprise SSO system
author: "Encvoy ID Team"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Installation and First Launch"
order: 2
---

# How to Install Encvoy ID

In this guide, you will learn how to install the **Encvoy ID** SSO system via Docker on your server. We will walk through the entire process — from environment preparation to the administrator's first login.

**Contents:**

- [Installation Requirements](#installation-requirements)
- [Installing Docker and Docker Compose](#install-docker-and-docker-compose)
- [Installing the SSO System](#install-sso-system)
- [First Login](#first-login)
- [See Also](#see-also)

---

## Installation Requirements { #installation-requirements }

### Server System Requirements

Before installing the **Encvoy ID** system, ensure that your infrastructure meets the requirements.

System requirements depend on the planned load. A minimal configuration is sufficient for test environments, while recommended parameters should be used for production environments.

#### Minimal Configuration

| Component             | Requirements   |
| --------------------- | -------------- |
| **RAM**               | 4 GB           |
| **Disk Space**        | 50 GB SSD      |
| **Processor (CPU)**   | 2 cores x86_64 |
| **Network Interface** | 1 Gbps         |

#### Recommended Configuration

| Component             | Requirements      |
| --------------------- | ----------------- |
| **RAM**               | 8 GB or more      |
| **Disk Space**        | 100 GB SSD/NVMe   |
| **Processor (CPU)**   | 4+ cores x86_64   |
| **Network Interface** | 1 Gbps and higher |

> 💡 **Tip:** For high-load systems with thousands of users, it is recommended to use: <br>
>
> - 16+ GB RAM<br>
> - 8+ CPU cores<br>
> - NVMe drives for maximum database performance

### Software Requirements

#### Software

| Component            | Supported Versions                                                                              | Additional Information                     |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Operating System** | Ubuntu 18.04 LTS (Bionic Beaver), <br> Ubuntu 20.04 LTS (Focal Fossa),<br> Debian 11 (Bullseye) | Any Linux distribution with Docker support |
| **Docker Engine**    | 19.03+                                                                                          | -                                          |
| **Docker Compose**   | 1.27+                                                                                           | -                                          |
| **Nginx/Apache**     | Any modern version                                                                              | -                                          |

#### General Requirements

For successful installation and correct operation of **Encvoy ID**, several conditions must be met:

- A server with a static IP address.
- Access to all workstations via the port that will be used to access the system.
- Availability of an email server (SMTP server).
- Connection to the service must be established via HTTPS protocol.

---

## Installing Docker and Docker Compose { #install-docker-and-docker-compose }

**Encvoy ID** is deployed as a set of Docker containers and can be used as an enterprise OAuth 2.0 Authorization Server and OpenID Connect Provider (IdP).

> 📚 [Docker Documentation](https://docs.docker.com/engine/install/)

### Step 1. Installing Docker Engine

**For Ubuntu/Debian:**

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verify installation
sudo docker --version
```

**For CentOS/RHEL:**

```bash
# Install yum-utils
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
```

### Step 2. Installing Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Set execution permissions
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

> 💡 Version requirements: **Docker Engine 20.10+** and **Docker Compose 1.29+**. Use `docker --version` and `docker-compose --version` to check.

---

## Installing the SSO System { #install-sso-system }

### Step 1. Preparing the Working Directory

Create and navigate to the installation directory:

```bash
# Create directory
mkdir trusted-id && cd trusted-id

# Check current path
pwd  # Should display: /home/your_user/trusted-id
```

### Step 2. Downloading Configuration Files

Download the necessary configuration files:

```bash
# Download main files
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/docker-compose.yaml
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/nginx.conf
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/build.sh
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/.env

# Verify download
ls -la
```

**Downloaded files:**

| File                    | Purpose                            |
| ----------------------- | ---------------------------------- |
| **docker-compose.yaml** | Docker container configuration     |
| **nginx.conf**          | Nginx web server settings          |
| **build.sh**            | Setup and build script             |
| **.env**                | Environment variables and settings |

### Step 3. Setting Permissions

Make the build script executable:

```bash
# Set permissions for the build script
chmod +x ./build.sh

# Verify permissions
ls -l build.sh
```

> ⚙️ After installation, it is recommended to perform basic configuration. A detailed description of all parameters is available in the [Encvoy ID Environment Variables](./docs-03-box-system-configuration.md) section.

### Step 4. Configuring Settings

Edit the `.env` file with the main settings:

```bash
# Open the file for editing (use nano or vim)
nano .env
```

**Required settings:**

```env
# Main system domain
ID_HOST=id.example.com  # Replace with your domain or IP

# Administrator email
ADMIN_MAIL=example@mail.com  # Replace with a real email
```

### Step 5. Running the Build Script

Run the setup script:

```bash
./build.sh
```

As a result, the **ID_HOST** variable value will be written to the **nginx.conf** file, and the **CLIENT_ID** and **CLIENT_SECRET** variables will be written to the **.env** file.

### Step 6. Starting the System

Launch the project:

```bash
docker compose up -d
```

### Useful Docker Compose Commands

| Command       | Description               | Usage Example            |
| ------------- | ------------------------- | ------------------------ |
| **View logs** | Monitor logs in real-time | `docker compose logs -f` |
| **Stop**      | Stop all containers       | `docker compose stop`    |
| **Start**     | Start stopped containers  | `docker compose start`   |
| **Restart**   | Restart all containers    | `docker compose restart` |
| **Status**    | View container status     | `docker compose ps`      |

---

## First Login { #first-login }

### Default Administrator Credentials

After installation, an administrative account with **Administrator** rights is created:

- **Login** — `root`,
- **Password** — `changethis`,
- **Role** — **Administrator**.

> 📌 These credentials provide full access to the system. Be sure to change the password immediately after the first login.

### First Login

To access the **Encvoy ID** web interface, navigate to: `https://ID_HOST`.

1. In the first step of the login widget, enter the login and click **Log in**.
2. Enter the password in the second step and click **Log in**.

After authorization, you will be redirected to the user's [Profile](./docs-12-common-personal-profile.md).

### Accessing the Admin Panel { #admin-panel-access }

Administration settings are located in the Admin Panel.

To access the panel:

1. Click on your name in the upper right corner of the window.
2. In the mini-widget that opens, click on the service name **Encvoy ID**.
3. You will be redirected to the **Admin Panel**.

---

## See Also { #see-also }

- [Encvoy ID System Description](./docs-01-box-about.md) — overview of **Encvoy ID** features.
- [Encvoy ID Environment Variables](./docs-03-box-system-configuration.md) — guide for preparing configuration before launch.
- [System Configuration](./docs-04-box-system-settings.md) — guide for configuring the interface and user access to the system.
