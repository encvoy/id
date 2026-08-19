---
title: "WebAuthn Login — Connecting in Encvoy ID"
description: "Learn how to connect WebAuthn login in Encvoy ID: create a login method and add it to the authorization widget. Connect in just a few steps."
keywords:
  - WebAuthn login
  - WebAuthn authentication
  - WebAuthn connection
  - WebAuthn setup
  - WebAuthn Encvoy ID
  - login via WebAuthn Encvoy ID
  - configuring WebAuthn in Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via WebAuthn"
---

# How to Connect WebAuthn Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to connect **WebAuthn** authentication to the **Encvoy ID** system.

**Table of Contents:**

- [General Information](#general-info)
- [Configuring WebAuthn Authentication for Administrators](#webauthn-admin-setup)
- [Adding a Key for a User](#adding-key-for-user)
- [See Also](#see-also)

---

## General Information { #general-info }

**WebAuthn** (Web Authentication) is an authentication standard that allows users to log in without a password using secure verification methods:

- biometrics (Face ID, Touch ID);
- hardware security keys;
- built-in device security modules.

**WebAuthn** is part of the **FIDO2** specification and is supported by all modern browsers.

> 🔐 **WebAuthn** can be used as a primary login method or as an additional factor for multi-factor authentication.

### How WebAuthn Works

1. **User Registration:**
   - The user creates an authentication key.
   - The device generates a key pair: the public key is stored in the system, while the private key remains only with the user.

2. **Login Initiation:**
   - The user selects the **WebAuthn** login method on the web resource.
   - The server sends a challenge (`challenge`) to verify identity.

3. **User Authentication:**
   - The device or token signs the `challenge` with the private key.
   - The server verifies the signature using the stored public key.
   - If the signature is valid, the user is granted access.

4. **Establishing a Secure Channel:** After successful authentication, the user logs into the system without transmitting a password over the network.

---

## Configuring WebAuthn Authentication for Administrators { #webauthn-admin-setup }

### Step 1. Creating a Login Method

1. Go to the Administrator Dashboard → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Dashboard**. If the login method is needed for a specific application, open the **settings of that application**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **WebAuthn** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name that users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the default one will be used.

   **Additional Settings**
   - **Public login method** — Enable this so the login method can be added to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Set the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

### Step 2. Adding the WebAuthn Provider to the Widget

To make the **WebAuthn** button visible to users on the authorization form, you need to activate this feature in the widget settings:

1. Find the created login method in the general list of providers.
2. Toggle the switch on the provider panel to the "On" position.

> **Verification**: After saving, open the login form in a test application. A new button with the **WebAuthn** logo should appear on the widget.

---

## Adding a Key for a User { #adding-key-for-user }

### Step 1. Adding a Key to the Device

Registering a **WebAuthn** key is the process of creating a public and private key pair and linking it to a specific user.

To use **WebAuthn** login, the user must first register a key—this can be a built-in authenticator (e.g., **Touch ID**, **Face ID**, or **Windows Hello**) or an external physical security key.

During the key addition process, a unique cryptographic pair is created—**public** and **private keys**.

- The private key is securely stored on the user's device and is never transmitted over the network.
- The public key is stored on the **Encvoy ID** server and is used for subsequent authentication verification during login.

After registering the key, the user needs to add the **WebAuthn** identifier to their **Encvoy ID** profile.

### Step 2. Adding the Identifier to the Profile

1. Go to your **Profile**.
2. Click **Add** in the **Identifiers** block.

<img src="./images/personal-profile-12.webp" alt="Identifiers block in user profile" style="max-width:600px; width:100%">

3. In the window that opens, select the **WebAuthn** login method.
4. In the system prompt, specify the previously registered key.

> 💡 **Tip**: If the identifier is already linked to another user, it must be removed from that user's profile before it can be linked to the new account.

---

## See Also { #see-also }

- [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) — a guide to login methods and configuring the login widget.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — a guide to working with organizations in the **Encvoy ID** system.
- [Personal Profile and App Permission Management](./docs-12-common-personal-profile.md) — a guide to managing your personal profile.
