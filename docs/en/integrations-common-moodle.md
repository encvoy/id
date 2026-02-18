---
title: "Moodle Integration with Encvoy ID — Setting up Single Sign-On"
description: "Learn how to set up Single Sign-On in Moodle via Encvoy ID: simple configuration, data protection, and seamless access for all company employees."
keywords:
  - Moodle integration with Encvoy ID
  - Moodle Encvoy ID
  - Moodle SSO
  - Moodle single sign-on
  - SSO login to Moodle
  - single sign-on in Moodle
  - Moodle authentication
  - Moodle authorization
  - OAuth authentication Moodle
  - OAuth Moodle
  - configuring Moodle with Encvoy ID
  - connecting Moodle to Encvoy ID
  - single sign-on in moodle
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integration with Moodle"
---

# How to Configure Moodle Integration with Encvoy ID

In this guide, you will learn how to set up Single Sign-On (SSO) in **Moodle** using the **Encvoy ID** system.

> 📌 [Moodle](https://moodle.org/) is a learning management system for electronic educational courses (e-learning).

Setting up login via **Encvoy ID** consists of several key stages performed in two different systems:

- [Step 1. Create Application](#step-1-create-application)
- [Step 2. Configure Moodle System](#step-2-configure-moodle)
- [Step 3. Verify Connection](#step-3-verify-connection)

---

## Step 1. Create Application { #step-1-create-application }

1. Log in to the **Encvoy ID** system.
2. Create an application with the following settings:
   - **Application Address** - the address of your **Moodle** installation;
   - **Redirect URL \#1 (Redirect_uri)** - `<Moodle installation address>/admin/oauth2callback.php`.

   For more details on creating applications, read the [instructions](./docs-10-common-app-settings.md#creating-application).

3. Open the [application settings](./docs-10-common-app-settings.md#editing-application) and copy the values of the following fields:
   - **Client ID** (`Client_id`),
   - **Client Secret** (`client_secret`).

---

## Step 2. Configure Moodle System { #step-2-configure-moodle }

> Administrator rights in **Moodle** are required to configure user authentication.

### Enable OAuth2 Plugin

1. Log in to **Moodle** with administrative rights.
2. Go to **Site administration - Plugins - Authentication** and activate the **OAuth 2** plugin by enabling it in the **Enable** column.

<img src="./images/integrations-moodle-01.webp" alt="Enabling OAuth 2 plugin in Moodle" style="max-width:700px; width:100%">

### Create a Custom Provider

1. Go to **Site administration** → **Server** → **OAuth 2 services**.
2. Click the **Custom** button.

<img src="./images/integrations-moodle-02.webp" alt="Button to create a custom provider in Moodle" style="max-width:700px; width:100%">

3. The provider creation form will open.
4. Fill in the fields:
   - **Name** — any display name for the service;
   - **Client ID** — the `Client_id` of the **Encvoy ID** application;
   - **Client Secret** — the `Client_secret` of the **Encvoy ID** application;
   - **Service Base URL** — `<Encvoy ID Address>/api/oidc`;
   - **Show on login page** — **Login page and internal services**;
   - **Scopes included in a login request** — `openid profile email offline_access`;
   - **Scopes included in a login request for offline access** — `offline_access`.

   <img src="./images/integrations-moodle-03.webp" alt="Moodle provider creation form - step 1" style="max-width:700px; width:100%">

5. Save changes.

### Configure Endpoints

1. Click **Configure endpoints** in the **Edit** column.

<img src="./images/integrations-moodle-04.webp" alt="Button to navigate to endpoint settings" style="max-width:700px; width:100%">

2. If all data was entered correctly, the settings will be populated automatically.

   <img src="./images/integrations-moodle-05.webp" alt="Configuring provider endpoints in Moodle" style="max-width:700px; width:100%">

   > If necessary, you can fill in the endpoint URLs manually. See the list of available URLs at: `https://<Encvoy ID service address>/api/oidc/.well-known/openid-configuration`

### Configure User Field Mapping

1. Click **Configure user field mappings** in the **Edit** column.

<img src="./images/integrations-moodle-06.webp" alt="Button to navigate to user field mapping settings" style="max-width:700px; width:100%">

2. If all data was entered correctly, the settings will be populated automatically.

   <img src="./images/integrations-moodle-07.webp" alt="Configuring provider user field mapping in Moodle" style="max-width:700px; width:100%">

   > If necessary, mappings can be configured manually.

### Configure Email Sending in Moodle

If the LMS requires sending emails to users, you must configure email settings (if not previously set):

1. Go to **Site administration → Server → Email → Outgoing mail configuration**.
2. Fill in the fields:
   - **SMTP hosts** — the full name of the SMTP server, including the port separated by a colon;
   - **SMTP security** — select a value from the list;
   - **SMTP Auth type** — select the required value. If **LOGIN** authentication type is selected, fill in the **SMTP username** and **SMTP password** fields. It is recommended to fill in the **No-reply address** field to avoid potential issues when sending emails.

   <img src="./images/integrations-moodle-09.webp" alt="Outgoing mail configuration" style="max-width:700px; width:100%">

> 💡 Linking a Moodle LMS user with a Encvoy ID user is based on the email address. The absence of an email in the Encvoy ID profile will make authentication in Moodle impossible. Deleting an email address previously linked to Moodle in Encvoy ID and adding a new email address will result in the creation of a new user in Moodle.

---

## Step 3. Verify Connection { #step-3-verify-connection }

1. Return to the **OAuth 2 services** list and ensure that the created provider is active.

<img src="./images/integrations-moodle-08.webp" alt="Checking the activity of the created provider" style="max-width:700px; width:100%">

2. Open the **Moodle** login page.
3. Ensure that the **Log in using Encvoy ID** button has appeared.
4. Click the button and log in using your corporate credentials:
   - You will be redirected to the **Encvoy ID** authentication page;
   - After a successful login, you will be redirected back to **Moodle** as an authorized user.

   <img src="./images/integrations-moodle-10.webp" alt="Moodle login widget" style="max-width:300px; width:100%">
