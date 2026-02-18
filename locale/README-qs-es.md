**[English](../README-qs.md)** | **Español** | **[Italiano](README-qs-it.md)** | **[Français](README-qs-fr.md)** | **[Deutsch](README-qs-de.md)**

## Inicio Rápido (Desarrollo Local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/encvoy/id.git
cd id
```

### 2. Agregar dominio a hosts

Archivo: `/etc/hosts`

```text
127.0.0.1 local.encvoy.com
```

### 3. Instalar dependencias del proyecto raíz

```bash
npm install
```

### 4. Instalar dependencias de todos los subproyectos

```bash
npm run init
```

### 5. Instalar Docker Engine

Guía oficial:\
https://docs.docker.com/engine/install/

### 6. Preparar archivo de entorno

Copiar `.example.env` a `.local.env`\
(configure sus variables si es necesario):

```bash
cp .example.env .local.env
```

### 7. Configurar `.local.env`

Agregar o sobrescribir variables locales:

```env
VITE_CLIENT_ID=
VITE_CUSTOM_STYLES=
VITE_DATA_PROCESSING_POLICY_URL=
VITE_COPYRIGHT=
```

### 8. Solo Windows --- especificar ruta de bash para scripts npm

**x86:**

```bash
npm config set script-shell "C:\Program Files (x86)\Git\bin\bash.exe"
```

**x64:**

```bash
npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

### 9. Iniciar contenedores docker

```bash
docker compose up -d
```

### 10. Actualizar estructura de base de datos

```bash
npm run prisma:update
```

### 11. Generar certificados SSL

#### Instalar Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Actualizar Homebrew

```bash
brew update
```

#### Instalar mkcert

```bash
brew install mkcert
```

#### Instalar Autoridad de Certificación local

```bash
mkcert -install
```

Después de una instalación exitosa:

```text
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)!
```

#### Generar certificado

```bash
mkcert local.encvoy.com
```

Mover los certificados generados a la carpeta `certs/`.

### 12. Instalar e iniciar nginx

#### macOS

Homebrew --- ver paso 11.

Instalar nginx:

```bash
brew install nginx
```

Iniciar nginx:

```bash
npm run nginx:start
```

### 13. Iniciar la aplicación

```bash
npm run start
```
