---
title: "Login via HOTP — Connection and Configuration in Encvoy ID"
description: "Learn how to enable HOTP login in Encvoy ID: create a login method, add it to the authorization widget, and ensure secure access for users."
keywords:
  - login via HOTP
  - HOTP authentication
  - HOTP configuration
  - HOTP connection
  - HOTP login
  - HOTP two-factor authentication
  - HOTP Encvoy ID
  - login via HOTP Encvoy ID
  - HOTP setup in Encvoy ID
  - HOTP
  - HMAC-based One-Time Password
  - one-time password
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via HOTP"
---

# How to Connect Login via HOTP in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to connect **HOTP** one-time password authentication to the **Encvoy ID** system.

Who this guide is for:

- Administrators — to configure the login method in the system.
- Users — to link **HOTP** to their profile.

Setting up login via **HOTP** consists of several key stages:

- [Authentication Setup for Administrators](#admin-authentication-setup)
- [HOTP Binding for Users](#hotp-user-binding)

---

## General Information

**HOTP** (HMAC-based One-Time Password) is an algorithm for generating one-time passwords based on a secret key and a counter that increments with each successful code use. It is widely used for two-factor authentication, adding a layer of security on top of the standard username and password.

The main difference between **HOTP** and **TOTP** is that codes do not depend on time. Each use of a code increments the counter, and the server verifies the entered code against the current counter value.

> 💡 To create a login method based on **TOTP**, use the [How to Connect Login via TOTP](./instructions-common-provider-totp.md) guide.

**Main Components:**

- **Authentication Server** — the server that generates the secret key and verifies the entered codes, taking the counter into account.
- **Authenticator** — an application that stores the secret key and the current counter, generating one-time passwords.
- **Secret Key** — a shared base between the server and the application used to generate codes.

### How HOTP Works

1. **Preliminary Setup**
   - The administrator creates an **HOTP** login method and activates it for the widgets of the required applications.
   - The user adds a new **HOTP** identifier in their profile by scanning a QR code with the secret key using an authenticator app.

2. **Code Generation and Verification**
   - The authenticator app calculates a one-time password based on the secret key and the current counter value using the `SHA1`, `SHA256`, or `SHA512` algorithm.
   - When the user enters the code on the login form, the server calculates the expected code using the same secret and current counter.
   - If the code matches, the server increments the counter and grants access to the user.

> 🚨 **Important**: **HOTP** is not time-dependent, so clock synchronization is not required.

---

## Authentication Setup for Administrators { #admin-authentication-setup }

### Step 1. Creating a Login Method

1. Go to the Admin Panel → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Dashboard**. If the login method is needed for a specific application, open the **settings of that application**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **HOTP** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name that users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the default one will be used.

   **Parameters**
   - **Number of digits** — The number of digits in the one-time password (usually 6).
   - **Initial counter value** — Current counter (not editable).
   - **Algorithm** — Hashing algorithm (`SHA1`, `SHA256`, or `SHA512`) (usually `SHA-1`).

   **Advanced Settings**
   - **Public login method** — Enable this if you want this login method to be available for addition to other system (or organization) applications, as well as to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Set the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

### Step 2. Adding the HOTP Provider to the Widget

To make the **HOTP** button visible to users on the authorization form, you need to activate this feature in the widget settings:

1. Find the created login method in the general list of providers.
2. Toggle the switch on the provider panel.

> **Verification**: After saving, open the login form in a test application. A new button with the **HOTP** logo should appear on the widget.

---

## HOTP Binding for Users { #hotp-user-binding }

> 📌 This instruction is intended for users who need to log in to the system via **HOTP**.

### Step 1. Installing an Authenticator App

You need to install an application on your mobile device that generates HOTP codes.

The most popular options are:

- **Google Authenticator** (Google)

### Step 2. Adding an HOTP Identifier to the Profile

1. Go to your **Profile**.
2. Click **Add** in the **Identifiers** block.

<img src="./images/personal-profile-12.webp" alt="Identifier block in the Encvoy ID user profile" style="max-width:600px; width:100%">

3. In the window that opens, select the **HOTP** login method.

4. Scan the QR code using the authenticator app.
5. Enter the code from the app and confirm.

> 💡 **Tip**: If the identifier is already linked to another user, you must remove it from that user's profile before linking it to the new account.

### Step 3. Verification

1. Go to the login page where the **HOTP** login method is enabled.
2. Select the **HOTP** login method icon.
3. A form for entering the code will open. Without closing the page, open the authenticator app on your phone.
4. Find the service corresponding to **Encvoy ID** (or the application name) and enter your login and the 6-digit code in the field on the login form.
5. Click the **Confirm** button.

---

## See Also

- [Login Methods and Login Widget Configuration](./docs-06-github-en-providers-settings.md) — a guide to login methods and configuring the login widget.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — a guide to working with organizations in the **Encvoy ID** system.
- [Personal Profile and Application Permission Management](./docs-12-common-personal-profile.md) — a guide to managing your personal profile.
