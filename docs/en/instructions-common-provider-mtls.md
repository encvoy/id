---
title: "mTLS Login — Connecting in Encvoy ID"
description: "Learn how to enable mTLS login in Encvoy ID: create a login method and add it to the authorization widget. Connect in just a few steps."
keywords:
  - mTLS login
  - mTLS authentication
  - mTLS connection
  - mTLS configuration
  - mTLS Encvoy ID
  - login via mTLS Encvoy ID
  - setting up mTLS in Encvoy ID
date: 2025-12-12
updated: 2025-12-22
product: [box, github]
region: [ru, en]
menu_title: "mTLS Login"
---

# How to Connect mTLS Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to connect **mTLS** authentication to the **Encvoy ID** system.

Setting up login via **mTLS** consists of several key stages:

1. Configuring mTLS authentication for **Encvoy ID** administrators
   - [Step 1. Configure Nginx for mTLS](#step-1-configure-nginx-for-mtls)
   - [Step 2. Create mTLS Provider](#step-2-create-mtls-provider)
   - [Step 3. Add mTLS Provider to Widget](#step-3-add-mtls-to-widget)

2. Linking a client certificate for **Encvoy ID** users
   - [Step 1. Install Client Certificate in Browser](#step-1-install-client-certificate)
   - [Step 2. Add Identifier to Profile](#step-2-add-identifier-to-profile)
   - [Step 3. Verify](#step-3-verify)

---

## General Information

**mTLS** (Mutual TLS) is an authentication method based on mutual verification of client and server certificates.

This method provides a high level of trust and security, as system login is only possible if the user possesses a valid certificate signed by a trusted Certificate Authority (CA).

**mTLS** is particularly useful for corporate or sensitive systems where minimizing the risk of unauthorized access is required.

### mTLS Workflow

1. **Connection Initiation:** The client sends a request to the **Encvoy ID** server.
2. **Client Certificate Request:** The server requires a client certificate to be provided.
3. **Sending Client Certificate:** The client provides its certificate signed by a trusted CA.
4. **Certificate Verification on Server:**
   - The server verifies the certificate against the root CA.
   - Checks expiration date, signature, and compliance with security requirements.

5. **User Authentication:**
   - If the certificate is valid, the server maps it to the user account and grants access.
   - If the certificate is invalid or missing, access is denied.

6. **Establishing a Secure Channel:** After successful certificate verification, an **encrypted connection** is established, and the user gains access.

---

## Configuring mTLS Authentication for Encvoy ID Administrators

For **mTLS** to work, you must:

- configure the **Nginx** web server to accept only requests signed by a trusted certificate;
- create and activate the **mTLS** provider in the **Encvoy ID** interface;
- install client certificates on user devices.

### Step 1. Configure Nginx for mTLS { #step-1-configure-nginx-for-mtls }

Before adding the provider in **Encvoy ID**, you need to prepare the **Nginx** configuration:

1. Open the `nginx.local.conf` configuration file.
2. Add a new `server` block:

   **Configuration Example**:

   ```nginx
   server {
      server_name local.trusted.com;
      listen 3443 ssl;

      # Server certificates
      ssl_certificate         certs/local.trusted.com.pem;
      ssl_certificate_key     certs/local.trusted.com-key.pem;

      # Root CA certificate for client certificate verification
      ssl_client_certificate  certs/ca-bundle.crt;
      ssl_verify_client on;
      ssl_verify_depth 3;

      # Session and protocol settings
      ssl_session_timeout 10m;
      ssl_session_cache shared:SSL:10m;
      ssl_protocols TLSv1.2 TLSv1.3;

      # Restrict access to the main path, mTLS allowed only for /api/mtls
      location / {
          return 404 "mTLS endpoints only. Use port 443 for regular access.";
      }

      # Proxy request settings to backend
      location /api/mtls {
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;

          # Passing client certificate information
          proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
          proxy_set_header X-SSL-Client-DN $ssl_client_s_dn;
          proxy_set_header X-SSL-Client-Serial $ssl_client_serial;
          proxy_set_header X-SSL-Client-Fingerprint $ssl_client_fingerprint;
          proxy_set_header X-SSL-Client-Issuer $ssl_client_i_dn;

          # Proxying to backend
          proxy_pass http://backend;
          proxy_redirect off;
      }
   }
   ```

3. Restart **Nginx** after making changes.

#### Parameter Descriptions

| Parameter                         | Purpose                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| `ssl_certificate`                 | Server certificate used for HTTPS.                          |
| `ssl_certificate_key`             | Server private key.                                         |
| `ssl_client_certificate`          | Root CA certificate for verifying client certificates.      |
| `ssl_verify_client on`            | Enables mandatory client certificate verification.          |
| `ssl_verify_depth`                | Maximum depth of the client certificate verification chain. |
| `ssl_session_timeout`             | SSL session lifetime.                                       |
| `ssl_protocols`                   | Allowed TLS versions.                                       |
| `proxy_set_header X-SSL-Client-*` | Passes client certificate information to the backend.       |

- Place the server certificates (`.pem` and key) and the root CA (`ca-bundle.crt`) in a convenient directory, e.g., `certs/`.
- Specify the path to the certificates in the **Nginx** configuration.

### Step 2. Create mTLS Provider { #step-2-create-mtls-provider }

1. Go to the Admin Panel → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Cabinet**. If the login method is needed for a specific application, open **that application's settings**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **mTLS** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name users will see.
   - **Description** (optional) — A short description.
   - **Logo** (optional) — You can upload your own icon, or the default one will be used.

   **Additional Settings**
   - **Public login method** — Enable this so the login method can be added to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Set the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

### Step 3. Add mTLS Provider to Widget { #step-3-add-mtls-to-widget }

For users to see the **mTLS** button on the authorization form, you need to activate this feature in the widget settings:

1. Find the created login method in the general list of providers.
2. Turn on the toggle on the provider panel.

> **Verification**: After saving, open the login form in a test application. A new button with the **mTLS** logo should appear on the widget.

---

## Linking a Client Certificate for Encvoy ID Users

> 📌 This instruction is intended for users who need to log in to the system via **mTLS**.

### Step 1. Install Client Certificate in Browser { #step-1-install-client-certificate }

Before installation, ensure you have the certificate file in `.p12` or `.pfx` format.

This file must contain:

- your personal certificate,
- the private key,
- and the trust chain (if required).

#### Installation in Google Chrome / Microsoft Edge

1. Open the **Chrome** or **Edge** browser.
2. Go to **Settings** → **Privacy and security**.
3. Find the **Security** section.
4. Click **Manage certificates**.
5. Go to the **Personal** / **Your certificates** tab.
6. Click **Import...**.
7. In the Import Wizard, click **Next**.
8. Click **Browse** and select your `.p12` or `.pfx` file.
9. Enter the password you received with the certificate.
10. Select **Place all certificates in the following store**.
11. Click **Browse** and select **Personal**.
12. Click **Next** → **Finish**.
13. If a security warning appears, click **Yes**.

After successful installation, the certificate will appear in the list on the **Personal** / **Your certificates** tab.

#### Installation in Mozilla Firefox

1. Open the **Firefox** menu → **Settings**.
2. Go to the **Privacy & Security** section.
3. Scroll down to **Certificates**.
4. Click **View Certificates...**.
5. Go to the **Your Certificates** tab.
6. Click **Import...**.
7. Select your `.p12` or `.pfx` file.
8. Enter the certificate password.
9. Click **OK**.

After successful installation, the certificate will appear in the list on the **Your Certificates** tab.

> ⚠️ Certificates should only be installed on trusted devices, and the password must be kept strictly secure.

> 💡 After installing the certificate, when logging in via **mTLS**, the browser will automatically prompt you to select the appropriate certificate for authentication.

### Step 2. Add Identifier to Profile { #step-2-add-identifier-to-profile }

1. Go to your **Profile**.
2. Click **Add** in the **Identifiers** block.

<img src="./images/personal-profile-12.webp" alt="Identifiers block in user profile" style="max-width:600px; width:100%">

3. In the window that opens, select the **mTLS** login method.
4. Select the certificate installed in the previous step.

> 💡 **Tip**: If the identifier is already linked to another user, you must remove it from that user's profile before linking it to the new account.

### Step 3. Verify { #step-3-verify }

1. Go to the login page with the **mTLS** login method enabled.
2. Select the **mTLS** login method icon.
   - **First login**: the system may prompt you to select a client certificate.
   - **Subsequent logins**: authentication is performed automatically using the previously selected certificate.

---

## See Also

- [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) — guide on login methods and configuring the login widget.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — guide on working with organizations in the **Encvoy ID** system.
- [Personal Profile and App Permission Management](./docs-12-common-personal-profile.md) — guide on managing your personal profile.
