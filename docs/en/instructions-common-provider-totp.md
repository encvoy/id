---
title: "TOTP Login — Connection and Configuration in Encvoy ID"
description: "Learn how to enable TOTP login in Encvoy ID: create a login method, add it to the authorization widget, and ensure secure access for users."
keywords:
  # Основные действия
  - HOTP login
  - HOTP authentication
  - HOTP configuration
  - HOTP connection
  - login via HOTP
  - HOTP two-factor authentication
  - HOTP Encvoy ID
  - login via HOTP Encvoy ID
  - HOTP setup in Encvoy ID
  - difference between HOTP and TOTP
  - HOTP
  - HMAC-based One-Time Password
  - HMAC-based one-time password
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "TOTP Login"
---

# How to Connect TOTP Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to connect **TOTP** (Time-based One-Time Password) authentication to the **Encvoy ID** system.

Who this instruction is for:

- **Administrators** — to configure the login method in the system.
- **Users** — to link **TOTP** to their profile.

Setting up **TOTP** login consists of several key stages:

- [Authentication Setup for Administrators](#admin-authentication-setup)
- [TOTP Binding for Users](#totp-user-binding)

---

## General Information

**TOTP** (Time-based One-Time Password) is an algorithm for generating one-time passwords valid for a short period of time.

> 💡 To create a login method based on **HOTP**, use the [How to Connect HOTP Login](./instructions-common-provider-hotp.md) instruction.

The main difference between **TOTP** and **HOTP** is that the password generation is based on the current time. Usually, it does not use an exact timestamp but rather the current interval with pre-defined boundaries (typically 30 seconds).

**Main Components:**

- **Authentication Server** — the server that generates the secret key and verifies the entered codes.
- **Authenticator** — an application that stores the secret key and generates the current OTP.
- **Secret Key** — a shared base between the server and the application used for code generation.

### TOTP Workflow

1. **Preliminary Setup**
   - The administrator creates a **TOTP** login method and activates it for the widgets of the required applications.
   - The user adds a new **TOTP** identifier in their profile by scanning a QR code containing the secret key via an authenticator app.

2. **Code Generation and Verification**
   - The authenticator app calculates a one-time password based on the secret key and the current time interval (usually 30 seconds) using the `SHA1`, `SHA256`, or `SHA512` algorithm.
   - When the user enters the code on the login form, the server recalculates the expected code using the same secret and current time.
   - If the entered code matches the expected one, the user is granted access.

> 🚨 **Important**: The time on the user's device and the server must be synchronized. Time mismatch is the most common reason for code rejection. To compensate for small time differences, the server may accept codes from adjacent time intervals (usually ±1 interval).

---

## Authentication Setup for Administrators { #admin-authentication-setup }

### Step 1. Creating a Login Method

1. Go to the Admin Panel → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Dashboard**. If the login method is needed for a specific application, open **that application's settings**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **TOTP** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name that users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the default one will be used.

   **Parameters**
   - **Number of digits** — Number of digits in the one-time password (usually 6).
   - **Validity period** — Validity period of the one-time password in seconds (30 is recommended).
   - **Algorithm** — Hashing algorithm (`SHA1`, `SHA256`, or `SHA512`) (usually `SHA-1`).

   **Additional Settings**
   - **Public login method** — Enable this if you want this login method to be available for addition to other system (or organization) applications, as well as to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Configure the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

### Step 2. Adding the TOTP Provider to the Widget

For users to see the **TOTP** button on the authorization form, you need to activate this feature in the widget settings:

1. Find the created login method in the general list of providers.
2. Toggle the switch on the provider panel to the "On" position.

> **Verification**: After saving, open the login form in a test application. A new button with the **TOTP** logo should appear on the widget.

---

## TOTP Binding for Users { #totp-user-binding }

> 📌 This instruction is intended for users who need to log in to the system via **TOTP**.

### Step 1. Installing an Authenticator App

You need to install an application on your mobile device that generates TOTP codes.

The most popular options are:

- **Google Authenticator** (Google)

> 💡 Ensure that the time on your mobile device is set to update automatically (via the network). Incorrect time is the most common reason why codes are not accepted.

### Step 2. Adding a TOTP Identifier to the Profile

1. Go to your **Profile**.
2. Click **Add** in the **Identifiers** block.

<img src="./images/personal-profile-12.webp" alt="Identifier block in Encvoy ID user profile" style="max-width:600px; width:100%">

3. In the window that opens, select the **TOTP** login method.
4. Scan the QR code using your authenticator app.

<img src="./images/instructions-provider-totp-02.webp" alt="Dialog for adding a TOTP identifier in Encvoy ID user profile" style="max-width:400px; width:100%">

5. Enter the code from the app and confirm.

> 💡 **Tip**: If the identifier is already linked to another user, you must remove it from that user's profile before linking it to the new account.

### Step 3. Verification

1. Go to the login page where the **TOTP** login method is enabled.
2. Select the **TOTP** login method icon.
3. A form for entering the code will open.
4. Enter your login.

<img src="./images/instructions-provider-totp-03.webp" alt="Example of login widget for TOTP identifier in Encvoy ID" style="max-width:300px; width:100%">

5. Without closing the page, open the authenticator app on your phone. Copy the 6-digit code and paste it into the form.

6. Click the **Confirm** button.

> 🔄 **If the code is not accepted**: Ensure that the time on your phone and the server is synchronized. Try waiting for the next code to be generated (a new one appears every 30 seconds). If the problem persists, contact your administrator.

---

## See Also

- [Login Methods and Login Widget Configuration](./docs-06-github-en-providers-settings.md) — a guide to login methods and widget setup.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — a guide to working with organizations in the **Encvoy ID** system.
- [Personal Profile and App Permission Management](./docs-12-common-personal-profile.md) — a guide to managing your personal profile.
