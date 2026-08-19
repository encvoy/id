---
title: "OpenID Connect Login — Connecting in Encvoy ID"
description: "Learn how to enable OpenID Connect login in Encvoy ID: create a login method and add it to the authorization widget. Connect in just a few steps."
keywords:
  - OpenID Connect login
  - OpenID Connect
  - OIDC
  - oidc
  - OpenID Connect configuration
  - OpenID Connect connection
  - OpenID Connect authorization
  - OpenID Connect Encvoy ID
  - configure OpenID Connect in Encvoy ID
  - connect OpenID Connect to Encvoy ID
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "OIDC Login"
---

# How to Connect OpenID Connect Login in Encvoy ID

> 📋 This instruction is part of a series of articles on configuring login methods. For more details, read the [Login Methods and Widget Configuration](./docs-06-github-en-providers-settings.md) guide.

In this guide, you will learn how to connect **OpenID Connect** authentication to the **Encvoy ID** system.

Setting up login via **OpenID Connect** consists of three key steps performed in two different systems:

- [Step 1. Configuration on the External System Side](#step-1-configure-external-system)
- [Step 2. Creating a Login Method](#step-2-create-login-method)
- [Step 3. Adding to the Widget](#step-3-add-to-widget)
- [Parameters Description](#parameters-description)
- [See Also](#see-also)

---

## Step 1. Configuration on the External System Side { #step-1-configure-external-system }

1. Create an application in the external identity service.
2. Copy the values of the **Application ID/Client ID** and **Secret/Client Secret** fields. You will need them when creating the application in **Encvoy ID**.

---

## Step 2. Creating a Login Method { #step-2-create-login-method }

1. Go to the admin panel → **Settings** tab.

   > 💡 To create a login method for an organization, open the **Organization Dashboard**. If the login method is needed for a specific application, open **that application's settings**.

2. Find the **Login Methods** block and click **Configure**.
3. In the window that opens, click the **Create** button ![Create button](./images/button-create.webp "Create button").
4. A window with a list of templates will open.
5. Select the **OpenID Connect** template.
6. Fill out the creation form:

   **Basic Information**
   - **Name** — The name that users will see.
   - **Description** (optional) — A brief description.
   - **Logo** (optional) — You can upload your own icon, or the default one will be used.

   **Authentication Parameters**
   - **Client ID (client_id)** — Paste the copied **Application ID** (`Client ID`).
   - **Client secret (client_secret)** — Paste the copied **Secret** (`Client Secret`).
   - **Redirect URI** — This field will be filled automatically based on your domain.
   - **Base authorization server address (issuer)** — The address of the external identity service.
   - **Authorization endpoint (authorization_endpoint)** — The address where the user is redirected for authorization.
   - **Token endpoint (token_endpoint)** — The resource that provides token issuance.
   - **UserInfo endpoint (userinfo_endpoint)** — The resource that returns information about the current user.
   - **Requested permissions (scopes)** — A list of permissions to be requested from the identity provider. To add a permission, type its name and press **Enter**.

   **Additional Settings**
   - **Public login method** — Enable this if you want this login method to be available for addition to other applications in the system (or organization), as well as to the user profile as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers).
   - **Publicity** — Set the default publicity level for the external service identifier in the user profile.

7. Click **Create**.

After successful creation, the new login method will appear in the general list of providers.

---

## Step 3. Adding to the Widget { #step-3-add-to-widget }

To make the **Log in with OpenID Connect** button visible on the authorization form, you need to activate this feature in the widget settings:

1. Find the created login method in the general list of providers.
2. Toggle the switch on the provider panel.

> **Verification**: After saving, open the login form in a test application. A new button with the **OpenID Connect** logo should appear on the widget.

---

## Parameters Description { #parameters-description }

### Basic Information

| Name            | Description                                                                                  | Type                   | Limits             |
| --------------- | -------------------------------------------------------------------------------------------- | ---------------------- | ------------------ |
| **Name**        | The name that will be displayed in the **Encvoy ID** service interface                       | Text                   | Max 50 characters  |
| **Description** | A brief description that will be displayed in the **Encvoy ID** service interface            | Text                   | Max 255 characters |
| **Logo**        | The image that will be displayed in the **Encvoy ID** service interface and the login widget | JPG, GIF, PNG, or WEBP | Max size: 1 MB     |

### Authentication Parameters

| Name                                                | Parameter                | Description                                                                                                               |
| --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Client ID (client_id)**                           | `client_id`              | ID of the application created in the external system                                                                      |
| **Client secret (client_secret)**                   | `client_secret`          | Service access key of the application created on the external system side                                                 |
| **Redirect URI** (non-editable)                     | `redirect URI`           | The **Encvoy ID** address where the user is redirected after authentication in the third-party service                    |
| **Base authorization server address (issuer)**      | `issuer`                 | The address of the external identity service                                                                              |
| **Authorization endpoint (authorization_endpoint)** | `authorization_endpoint` | The address where the user is redirected for authorization                                                                |
| **Token endpoint (token_endpoint)**                 | `token_endpoint`         | The resource that provides token issuance                                                                                 |
| **UserInfo endpoint (userinfo_endpoint)**           | `userinfo_endpoint`      | The resource that returns information about the current user                                                              |
| **Requested permissions (scopes)**                  | -                        | A list of permissions to be requested from the identity provider. To add a permission, type its name and press **Enter**. |

### Additional Settings

| Name                    | Description                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public login method** | When activated: <br> - The login method becomes available for addition to other service applications. <br> - The login method becomes available for addition as an [external service identifier](./docs-12-common-personal-profile.md#external-service-identifiers) in the user profile. |
| **Publicity**           | Sets the default publicity level for the external service identifier in the user profile                                                                                                                                                                                                 |

---

## See Also { #see-also }

- [Login Methods and Login Widget Configuration](./docs-06-github-en-providers-settings.md) — guide on login methods and login widget setup.
- [Organization Management](./docs-09-common-mini-widget-settings.md) — guide on working with organizations in the **Encvoy ID** system.
- [Personal Profile and Application Permission Management](./docs-12-common-personal-profile.md) — guide on managing the personal profile.
