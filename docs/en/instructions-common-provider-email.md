---
title: "Email Login in Encvoy ID — Email Configuration"
description: "Learn how to enable email login in Encvoy ID: create a login method and add it to the authorization widget. Connect in just a few steps."
keywords:
  - email login in Encvoy ID
  - Email configuration
  - Email authentication
  - connect Email
  - Email login Encvoy ID
  - Email OAuth Encvoy ID
author: Encvoy ID Team
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Login via Email"
---

# How to Connect Email Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to enable email authentication in your organization or application. The Email login method will be used to send email notifications, such as registration emails, password recovery, and other events.

Setting up login via **Email** consists of several steps:

- [Step 1. Creating a login method](#step-1-create-login-method)
- [Step 2. Adding to the widget](#step-2-add-to-widget)

---

## Step 1. Creating a login method { #step-1-create-login-method }

1. Go to the Admin Panel → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Dashboard**. If the login method is needed for a specific application, open **that application's settings**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **Email** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name that users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the standard one will be used.

   **Parameters**
   - **Primary email address** — The primary email address that will be used for sending emails.
   - **Outgoing mail server address** — The outgoing mail server address.
   - **Outgoing mail server port** — The outgoing mail server port.
   - **Email password** — A regular password or an app password created in the email service account settings.
   - **Verification code TTL** — The lifetime of the confirmation code for the email service in seconds.

   **Additional Settings**
   - **Public login method** — Enable this if you want this login method to be available for addition to other system (or organization) applications, as well as to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

---

## Step 2. Adding to the widget { #step-2-add-to-widget }

To make the **Login via Email** button visible to users on the authorization form, you need to activate this feature in the widget settings:

1. Find the created login method in the general list of providers.
2. Toggle the switch on the provider panel.

> **Verification**: After saving, open the login form in a test application. A new button with the **Email** logo should appear on the widget.

---

## See Also

- [Login Methods and Login Widget Configuration](./docs-06-github-en-providers-settings.md) — a guide to login methods and configuring the login widget.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — a guide to working with organizations in the **Encvoy ID** system.
- [Personal Profile and App Permission Management](./docs-12-common-personal-profile.md) — a guide to managing the personal profile.
