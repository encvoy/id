---
title: "GitHub Login — Connection and Configuration in Encvoy ID"
description: "Learn how to enable GitHub login in Encvoy ID: create a login method and add it to the authorization widget. Connect in just a few steps."
keywords:
  - GitHub login
  - GitHub setup in Encvoy ID
  - GitHub authentication
  - GitHub connection
  - GitHub login Encvoy ID
  - GitHub OAuth Encvoy ID
  - GitHub sign in
  - GitHub authorization
  - GitHub Encvoy ID
  - login via GitHub Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [en]
menu_title: "GitHub Login"
---

# How to Connect GitHub Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to connect authentication using a **GitHub** account to the **Encvoy ID** system. This login method allows users to sign in to applications using their **GitHub** service account.

Setting up GitHub login consists of three key steps performed in two different systems.

- [Step 1. Configure GitHub App](#step-1-configure-github-app)
- [Step 2. Create Login Method](#step-2-create-login-method)
- [Step 3. Add to Widget](#step-3-add-to-widget)

---

## Step 1. Configure GitHub App { #step-1-configure-github-app }

Before configuring the login method in **Encvoy ID**, you must register your application in the **GitHub** developer console and obtain access keys:

1. Go to the **GitHub** settings via the link:
   [https://github.com/settings/developers](https://github.com/settings/developers)

2. In the **OAuth Apps** section, click **New OAuth App**.
3. Fill in the required application settings:
   - **Application name** - the name of the application,
   - **Homepage URL** - the address of the service installation,
   - **Authorization callback URL** - the address in the format `https://<installation_address>/api/interaction/code`.

   <img src="./images/instructions-provider-github-01.webp" alt="Creating a GitHub OAuth login method in the service developer console" style="max-width:400px; width:100%">

4. Click **Register application**.
5. After creating the application, open its settings and copy:
   - **Client ID**
   - **Client Secret** (created via the **Generate a new client secret** button)

   <img src="./images/instructions-provider-github-02.webp" alt="Creating a GitHub OAuth login method in the service developer console" style="max-width:700px; width:100%">

These values will be needed in the next step.

---

## Step 2. Create Login Method { #step-2-create-login-method }

1. Go to the Admin Console → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Console**. If the login method is needed for a specific application, open the **settings of that application**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create Button](./images/button-create.webp "Create Button").
4. A window with a list of templates will open.
5. Select the **GitHub** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the default one will be used.

   **Authentication Parameters**
   - **Client ID (client_id)** — Paste the copied **Client ID**.
   - **Client secret (client_secret)** — Paste the copied **Client Secret**.
   - **Redirect URI** — This field will be filled automatically based on your domain.

   **Additional Settings**
   - **Public login method** — Enable this if you want this login method to be available for addition to other applications in the system (or organization), as well as to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Configure the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

---

## Step 3. Add to Widget { #step-3-add-to-widget }

To make the **Sign in with GitHub** button visible on the authorization form, you need to activate this feature in the widget settings:

1. In the general list of providers, find the created login method.
2. Turn on the toggle switch on the provider panel.

> **Verification**: After saving, open the login form in a test application. A new button with the **GitHub** logo should appear on the widget.

---

## Parameter Descriptions

### Basic Information

| Name            | Description                                                                                  | Type                   | Constraints         |
| --------------- | -------------------------------------------------------------------------------------------- | ---------------------- | ------------------- |
| **Name**        | The name that will be displayed in the **Encvoy ID** service interface                       | Text                   | Max. 50 characters  |
| **Description** | A brief description that will be displayed in the **Encvoy ID** service interface            | Text                   | Max. 255 characters |
| **Logo**        | The image that will be displayed in the **Encvoy ID** service interface and the login widget | JPG, GIF, PNG, or WEBP | Max. size: 1 MB     |

### Authentication Parameters

| Name                              | Parameter       | Description                                                                                               |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| **Client ID (client_id)**         | `Client_id`     | The ID of the application created in **GitHub**                                                           |
| **Client secret (client_secret)** | `Client_secret` | The service access key of the application created in **GitHub**                                           |
| **Redirect URI** (non-editable)   | `Redirect URI`  | The **Encvoy ID** address to which the user is redirected after authentication in the third-party service |

### Additional Settings

| Name                    | Description                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public login method** | When activated: <br> - The login method becomes available for addition to other service applications. <br> - The login method becomes available for addition as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers) in the user profile. |
| **Publicity**           | Sets the default publicity level for the external service identifier in the user profile                                                                                                                                                                                                 |

---

## See Also

- [Login Methods and Login Widget Configuration](./docs-06-github-en-providers-settings.md) — a guide to login methods and configuring the login widget.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — a guide to working with organizations in the **Encvoy ID** system.
- [Personal Profile and Application Permission Management](./docs-12-common-personal-profile.md) — a guide to managing the personal profile.
