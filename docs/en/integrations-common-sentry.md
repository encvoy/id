---
title: "Sentry Integration with Encvoy ID — SSO Configuration"
description: "Learn how to set up single sign-on for Sentry via Encvoy ID: simple configuration, data protection, and seamless access for all company employees."
keywords: 
keywords:
  - Sentry integration with Encvoy ID
  - Sentry Encvoy ID
  - Sentry SSO
  - Sentry single sign-on
  - SSO login to Sentry
  - single sign-on in Sentry
  - Sentry authentication
  - Sentry authorization
  - OAuth authentication Sentry
  - OAuth Sentry
  - login to Sentry via Encvoy ID
  - Sentry configuration with Encvoy ID
  - connecting Sentry to Encvoy ID
  - sentry sso setup
  - single sign-on in sentry
author: "The Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integration with Sentry"
---

# How to Configure Sentry Integration with Encvoy ID

In this guide, you will learn how to set up Single Sign-On (SSO) for **Sentry** using the **Encvoy ID** system.

**Sentry** is a platform for application monitoring and error tracking. It helps developers identify, analyze, and fix errors in real-time, improving software quality.

The base version of the product does not support **OpenID Connect** authentication. To implement this feature, you can use an additional solution — [sentry-auth-oidc](https://github.com/siemens/sentry-auth-oidc). This is a specialized provider that enables **OpenID Connect** integration with **Sentry** and allows you to configure Single Sign-On (SSO) in the system.

Setting up login via **Encvoy ID** consists of several key steps performed in two different systems:

- [Step 1. Create an Application](#step-1-create-application)
- [Step 2. Install sentry-auth-oidc](#step-2-install-sentry-auth-oidc)
- [Step 3. Verify Connection](#step-3-verify-connection)

---

## Step 1. Create an Application { #step-1-create-application }

1. Log in or register with **Encvoy ID**.
2. Create an application with the following settings:

   | Field                           | Value                                   |
   | ------------------------------- | --------------------------------------- |
   | Application URL                 | Address of your **Sentry** installation |
   | Redirect URL \#1 (Redirect_uri) | `<installation address>/auth/sso`       |

   > 🔍 For more details on creating applications, read the [instructions](./docs-10-common-app-settings.md#creating-application).

3. Open the [application settings](./docs-10-common-app-settings.md#editing-application) and copy the values of the following fields:
   - **Client ID** (`Client_id`),
   - **Client Secret** (`client_secret`).

---

## Step 2. Install sentry-auth-oidc { #step-2-install-sentry-auth-oidc }

1. To install the provider, run the console command:

   ```python
   $ pip install sentry-auth-oidc
   ```

   or create a Shell script with the following content:

   ```sh
   #!/bin/bash
   set -euo pipefail
   apt-get update
   pip install sentry-auth-oidc
   ```

   and run it from the `<path to Sentry>/sentry/` directory.

2. After installing the provider, edit the **Sentry** configuration file `sentry.conf.py`. In the configuration file, add a block of variables with the **OIDC_CLIENT_ID** and **OIDC_CLIENT_SECRET** parameters copied from the **Encvoy ID** application.

   ```sh
   #################
   # OIDC #
   #################

   #SENTRY_MANAGED_USER_FIELDS = ('email', 'first_name', 'last_name', 'password', )

   OIDC_CLIENT_ID = "client id from Encvoy ID application"
   OIDC_CLIENT_SECRET = "client secret from Encvoy ID application"
   OIDC_SCOPE = "openid email profile"
   OIDC_DOMAIN = "https://<Encvoy ID address>/api/oidc"
   OIDC_ISSUER = "module name for issuing permissions"
   ```

   After this, run the `install.sh` script located in the root of the **Sentry** project, wait for the script to complete, and start the project.

3. Go to the **Sentry** admin panel at `https://<path to Sentry>/settings/sentry/` and select the **Auth** section. Then select the **Encvoy ID** application.

<img src="./images/integrations-sentry-03.webp" alt="Sentry Admin Panel" style="max-width:700px; width:100%">

Configure all necessary settings and save the changes. After this, authorization via **Encvoy ID** will be enabled, and login via username/password will be disabled.

---

## Step 3. Verify Connection { #step-3-verify-connection }

1. Open the **Sentry** login page.
2. Ensure that the **Login via Encvoy ID** button has appeared.
3. Click the button and log in using your corporate credentials:
   - You will be redirected to the **Encvoy ID** authentication page;
   - After a successful login, you will be returned to **Sentry** as an authorized user.

<img src="./images/integrations-sentry-01.webp" alt="Sentry Login Widget" style="max-width:500px; width:100%">
