---
title: "Google Login — Connection and Configuration in Encvoy ID"
description: "Learn how to connect Google login in Encvoy ID: create a login method and add it to the authorization widget. Connect in just a few steps."
keywords:
  - Google login
  - Google setup in Encvoy ID
  - Google authentication
  - connect Google
  - Google login Encvoy ID
  - Google OAuth Encvoy ID
  - Google sign-in
  - Google authorization
  - Google Encvoy ID
  - login via Google Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [en]
menu_title: "Google Login"
---

# How to Connect Google Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the guide [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md).

In this guide, you will learn how to connect authentication using a **Google** account to the **Encvoy ID** system. This login method allows users to sign in to applications using their **Google** service account.

Setting up **Google** login consists of three key steps performed in two different systems:

- [Step 1. Configure the Application in Google](#step-1-configure-google-app)
- [Step 2. Create the Login Method](#step-2-create-login-method)
- [Step 3. Add to the Widget](#step-3-add-to-widget)
- [Parameters Description](#parameters-description)
- [See Also](#see-also)

---

## Step 1. Configure the Application in Google { #step-1-configure-google-app }

Before configuring the login method in **Encvoy ID**, you must register your application in the **Google** developer console and obtain access keys:

1. Sign in with your **Google** account.
2. Open the [Google Cloud Console](https://code.google.com/apis/console#access).
3. Create a new project:
   - In the top panel, click **Select a project** → **New Project**.
   - Specify the project name (e.g., `Encvoy.ID Login` or your website name).
   - Click **Create**.

   > 🔗 For more details, read the instructions on [developers.google.com](https://developers.google.com/workspace/guides/create-project?hl=en).

4. Configure the **OAuth consent screen**. If you have previously performed these settings, skip this step.
   - Go to **APIs and Services** → **OAuth consent screen**.

     <img src="./images/instructions-provider-google-01.webp" alt="Creating a Google OAuth login method in the service developer console" style="max-width:700px; width:100%">

   - Open the **Branding** section.
   - Click the **Get started** button in the center of the window.
   - Provide **App Information**: the application name and the email address that will be displayed to users on the consent screen.
   - Select **Audience** type → **External**.

     <img src="./images/instructions-provider-google-03.webp" alt="Setting the name for the Google OAuth login method in the service developer console" style="max-width:700px; width:100%">

   - Provide an email address for receiving project notifications.
   - Agree to the user policy.

     <img src="./images/instructions-provider-google-04.webp" alt="Setting contact information for the Google OAuth login method in the service developer console" style="max-width:700px; width:100%">

5. Create an **OAuth Client ID**:
   - Go to **APIs and Services** → **Credentials**.
   - Click **Create credentials** → **OAuth client ID**.

     <img src="./images/instructions-provider-google-05.webp" alt="Configuring the Google OAuth login method in the service developer console" style="max-width:700px; width:100%">

   - Select **Type** → **Web application**.
   - Fill in the name and the return URL\#1 (`Redirect_uri`).
   - Click **Create**.

     <img src="./images/instructions-provider-google-06.webp" alt="Configuring the Google OAuth login method in the service developer console" style="max-width:500px; width:100%">

     > ⚠️ After creation, a window will appear with the data: `Client ID` and `Client Secret`. Save these values — you will need them when configuring in **Encvoy ID**.

     <img src="./images/instructions-provider-google-07.webp" alt="Configuring the Google OAuth login method in the service developer console" style="max-width:500px; width:100%">

6. Check the **OAuth consent screen** settings:

   Before use, ensure that:
   - The consent screen status is **Published** (Enabled), not **In development**,
   - The required **scopes** — `email` and `profile` — have been added.

---

## Step 2. Create the Login Method { #step-2-create-login-method }

Now, with the keys from **Google**, let's create the corresponding provider in the **Encvoy ID** system.

1. Go to the administrator panel → **Settings** tab.

   > 💡 To create a login method for an organization, open the **organization dashboard**. If the login method is needed for a specific application, open **that application's settings**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **Google** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name that users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the standard one will be used.

   **Authentication Parameters**
   - **Client ID (client_id)** — Paste the copied **Application ID** (`Client ID`).
   - **Client secret (client_secret)** — Paste the copied **Secret** (`Client Secret`).
   - **Redirect URI** — This field will be filled automatically based on your domain.

   **Additional Settings**
   - **Public login method** — Enable this if you want this login method to be available for addition to other system (or organization) applications, as well as to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Set the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

---

## Step 3. Add to the Widget { #step-3-add-to-widget }

To make the **Sign in with Google** button visible on the authorization form, you need to activate this function in the widget settings:

1. In the general list of providers, find the created login method.
2. Toggle the switch on the provider panel.

> **Verification**: After saving, open the login form in a test application. A new button with the **Google** logo should appear on the widget.

---

## Parameters Description { #parameters-description }

### Basic Information

| Name            | Description                                                                                  | Type                   | Constraints        |
| --------------- | -------------------------------------------------------------------------------------------- | ---------------------- | ------------------ |
| **Name**        | The name that will be displayed in the **Encvoy ID** service interface                       | Text                   | Max 50 characters  |
| **Description** | A brief description that will be displayed in the **Encvoy ID** service interface            | Text                   | Max 255 characters |
| **Logo**        | The image that will be displayed in the **Encvoy ID** service interface and the login widget | JPG, GIF, PNG, or WEBP | Max size: 1 MB     |

### Authentication Parameters

| Name                              | Parameter       | Description                                                                                               |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| **Client ID (client_id)**         | `Client_id`     | The ID of the application created in **Google**                                                           |
| **Client secret (client_secret)** | `Client_secret` | The service access key of the application created in **Google**                                           |
| **Redirect URI** (non-editable)   | `Redirect URI`  | The **Encvoy ID** address to which the user is redirected after authentication in the third-party service |

### Additional Settings

| Name                    | Description                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public login method** | When activated: <br> - The login method becomes available for addition to other service applications. <br> - The login method becomes available for addition as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers) in the user profile. |
| **Publicity**           | Sets the default publicity level for the external service identifier in the user profile                                                                                                                                                                                                 |

---

## See Also { #see-also }

- [Login Methods and Login Widget Configuration](./docs-06-github-en-providers-settings.md) — a guide to login methods and configuring the login widget.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — a guide to working with organizations in the **Encvoy ID** system.
- [Personal Profile and Application Permission Management](./docs-12-common-personal-profile.md) — a guide to managing the personal profile.
