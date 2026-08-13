---
title: "Instalación de {{projectName}} mediante Docker — Despliegue de SSO"
description: "Instale {{projectName}} mediante Docker: requisitos, configuración e inicio de sesión inicial. Despliegue de SSO paso a paso para administradores y DevOps."
keywords:
  - instalar {{projectName}}
  - instalando {{projectName}}
  - despliegue de sistema SSO
  - desplegar {{projectName}}
  - instalación docker {{projectName}}
  - docker compose {{projectName}}
  - sistema SSO empresarial
author: "Equipo de {{projectName}}"
date: 2025-12-11
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "Instalación y primer lanzamiento"
order: 2
---

# Cómo instalar {{projectName}}

En esta guía, aprenderá a instalar el sistema SSO **{{projectName}}** mediante Docker en su servidor. Recorreremos todo el proceso, desde la preparación del entorno hasta el primer inicio de sesión del administrador.

**Contenido:**

- [Requisitos de instalación](#installation-requirements)
- [Instalación de Docker y Docker Compose](#install-docker-and-docker-compose)
- [Instalación del sistema SSO](#install-sso-system)
- [Primer inicio de sesión](#first-login)
- [Vea también](#see-also)

---

## Requisitos de instalación { #installation-requirements }

### Requisitos del sistema del servidor

Antes de instalar el sistema **{{projectName}}**, asegúrese de que su infraestructura cumpla con los requisitos.

Los requisitos del sistema dependen de la carga prevista. Una configuración mínima es suficiente para entornos de prueba, mientras que para entornos de producción se deben utilizar los parámetros recomendados.

#### Configuración mínima

| Componente                   | Requisitos    |
| ---------------------------- | ------------- |
| **RAM**                      | 4 GB          |
| **Espacio en disco**         | 50 GB SSD     |
| **Procesador (CPU)**         | 2 núcleos x86_64|
| **Interfaz de red**          | 1 Gbps        |

#### Configuración recomendada

| Componente                   | Requisitos        |
| ---------------------------- | ----------------- |
| **RAM**                      | 8 GB o más        |
| **Espacio en disco**         | 100 GB SSD/NVMe   |
| **Procesador (CPU)**         | 4+ núcleos x86_64 |
| **Interfaz de red**          | 1 Gbps o superior |

> 💡 **Consejo:** Para sistemas de alta carga con miles de usuarios, se recomienda utilizar: <br>
>
> - 16+ GB de RAM<br>
> - 8+ núcleos de CPU<br>
> - Unidades NVMe para el máximo rendimiento de la base de datos

### Requisitos de software

#### Software

| Componente | Versiones compatibles | Información adicional |
| --- | --- | --- |
| **Sistema Operativo** | Ubuntu 18.04 LTS (Bionic Beaver), <br> Ubuntu 20.04 LTS (Focal Fossa),<br> Debian 11 (Bullseye) | Cualquier distribución Linux con soporte para Docker |
| **Docker Engine**        | 19.03+   | -  |
| **Docker Compose**       | 1.27+ | - |
| **Nginx/Apache**         | Cualquier versión moderna  | -  |

#### Requisitos generales

Para una instalación exitosa y el correcto funcionamiento de **{{projectName}}**, se deben cumplir varias condiciones:

- Un servidor con una dirección IP estática.
- Acceso a todas las estaciones de trabajo a través del puerto que se utilizará para acceder al sistema.
- Disponibilidad de un servidor de correo electrónico (servidor SMTP).
- La conexión al servicio debe establecerse mediante el protocolo HTTPS.

---

## Instalación de Docker y Docker Compose { #install-docker-and-docker-compose }

**{{projectName}}** se despliega como un conjunto de contenedores Docker y puede utilizarse como un servidor de autorización OAuth 2.0 empresarial y proveedor de OpenID Connect (IdP).

> 📚 [Documentación de Docker](https://docs.docker.com/engine/install/)

### Paso 1. Instalación de Docker Engine

**Para Ubuntu/Debian:**

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Añadir clave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Añadir repositorio
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verificar instalación
sudo docker --version
```

**Para CentOS/RHEL:**

```bash
# Instalar yum-utils
sudo yum install -y yum-utils

# Añadir repositorio de Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Iniciar y habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verificar instalación
sudo docker --version
```

### Paso 2. Instalación de Docker Compose

```bash
# Descargar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Establecer permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

> 💡 Requisitos de versión: **Docker Engine 20.10+** y **Docker Compose 1.29+**. Use `docker --version` y `docker-compose --version` para verificar.

---

## Instalación del sistema SSO { #install-sso-system }

### Paso 1. Preparación del directorio de trabajo

Cree y navegue al directorio de instalación:

```bash
# Crear directorio
mkdir trusted-id && cd trusted-id

# Verificar ruta actual
pwd  # Debería mostrar: /home/su_usuario/trusted-id
```

### Paso 2. Descarga de archivos de configuración

Descargue los archivos de configuración necesarios:

```bash
# Descargar archivos principales
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/docker-compose.yaml
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/nginx.conf
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/build.sh
curl -O https://git.digtlab.ru/trusted/id/-/raw/main/.env

# Verificar descarga
ls -la
```

**Archivos descargados:**

| Archivo                 | Propósito                                |
| ----------------------- | ---------------------------------------- |
| **docker-compose.yaml** | Configuración de contenedores Docker     |
| **nginx.conf**          | Ajustes del servidor web Nginx           |
| **build.sh**            | Script de configuración y construcción   |
| **.env**                | Variables de entorno y configuración     |

### Paso 3. Configuración de permisos

Haga que el script de construcción sea ejecutable:

```bash
# Establecer permisos para el script de construcción
chmod +x ./build.sh

# Verificar permisos
ls -l build.sh
```

> ⚙️ Después de la instalación, se recomienda realizar una configuración básica. Una descripción detallada de todos los parámetros está disponible en la sección [Variables de entorno de {{projectName}}](./docs-03-box-system-configuration.md).

### Paso 4. Ajuste de la configuración

Edite el archivo `.env` con los ajustes principales:

```bash
# Abrir el archivo para editar (use nano o vim)
nano .env
```

**Ajustes requeridos:**

```env
# Dominio principal del sistema
ID_HOST=id.example.com  # Reemplace con su dominio o IP

# Correo electrónico del administrador
ADMIN_MAIL=example@mail.com  # Reemplace con un correo real
```

### Paso 5. Ejecución del script de construcción

Ejecute el script de configuración:

```bash
./build.sh
```

Como resultado, el valor de la variable **ID_HOST** se escribirá en el archivo **nginx.conf**, y las variables **CLIENT_ID** y **CLIENT_SECRET** se escribirán en el archivo **.env**.

### Paso 6. Inicio del sistema

Lance el proyecto:

```bash
docker compose up -d
```

### Comandos útiles de Docker Compose

| Comando            | Descripción                           | Ejemplo de uso           |
| ------------------ | ------------------------------------- | ------------------------ |
| **Ver logs**       | Monitorear logs en tiempo real        | `docker compose logs -f` |
| **Detener**        | Detener todos los contenedores        | `docker compose stop`    |
| **Iniciar**        | Iniciar contenedores detenidos        | `docker compose start`   |
| **Reiniciar**      | Reiniciar todos los contenedores      | `docker compose restart` |
| **Estado**         | Ver el estado de los contenedores     | `docker compose ps`      |

---

## Primer inicio de sesión { #first-login }

### Credenciales de administrador por defecto

Después de la instalación, se crea una cuenta administrativa con derechos de **Administrador**:

- **Usuario** — `root`,
- **Contraseña** — `changethis`,
- **Rol** — **Administrador**.

> 📌 Estas credenciales proporcionan acceso total al sistema. Asegúrese de cambiar la contraseña inmediatamente después del primer inicio de sesión.

### Primer inicio de sesión

Para acceder a la interfaz web de **{{projectName}}**, navegue a: `https://ID_HOST`.

1. En el primer paso del widget de inicio de sesión, ingrese el usuario y haga clic en **Iniciar sesión**.
2. Ingrese la contraseña en el segundo paso y haga clic en **Iniciar sesión**.

Después de la autorización, será redirigido al [Perfil](./docs-12-common-personal-profile.md) del usuario.

### Acceso al Panel de Administración { #admin-panel-access }

Los ajustes de administración se encuentran en el Panel de Administración.

Para acceder al panel:

1. Haga clic en su nombre en la esquina superior derecha de la ventana.
2. En el mini-widget que se abre, haga clic en el nombre del servicio **{{projectName}}**.
3. Será redirigido al **Panel de Administración**.

---

## Vea también { #see-also }

- [Descripción del sistema {{projectName}}](./docs-01-box-about.md) — descripción general de las características de **{{projectName}}**.
- [Variables de entorno de {{projectName}}](./docs-03-box-system-configuration.md) — guía para preparar la configuración antes del lanzamiento.
- [Configuración del sistema](./docs-04-box-system-settings.md) — guía para configurar la interfaz y el acceso de los usuarios al sistema.