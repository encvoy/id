---
title: "Encvoy ID Login Methods — Connection and Configuration"
description: "Learn how to configure login methods and the authorization widget in Encvoy ID. Quick connection of OAuth, WebAuthn, mTLS, HOTP, and TOTP providers with examples."
keywords:
  - Encvoy ID login methods
  - SSO authorization
  - authorization widget
  - OAuth 2.0 configuration
  - authentication providers
  - WebAuthn mTLS TOTP
author: "Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github]
region: [en]
menu_title: "Login Methods Configuration"
order: 7
---

# How to Configure Login Methods in Encvoy ID

In this guide, you will learn how to configure login methods in **Encvoy ID**, including standard OAuth providers and enhanced authentication methods (WebAuthn, mTLS, TOTP). We will also explain how to properly set up and style the authorization widget to make the login process secure and user-friendly.

**Table of Contents:**

- [Login Methods Overview](#login-methods-overview)
- [Managing Login Methods](#managing-login-methods)
- [Login Widget Settings](#login-widget-settings)
- [See Also](#see-also)

---

## Login Methods Overview { #login-methods-overview }

A **login method** is an authentication method for users that allows them to authorize in the personal account or connected applications. It is a key element of the Single Sign-On system, providing flexible and secure identification.

### Authentication Provider Types in Encvoy ID

**Encvoy ID** supports the following types of login methods:

- **Basic methods**: login and password, email,
- **External identity providers**: social networks, trusted corporate systems, and other services,
- **Enhanced and passwordless methods:** cryptographic authentication via **mTLS** (client certificates) and **WebAuthn** (biometrics, hardware keys), as well as **TOTP/HOTP** one-time passwords.

Combine login methods to increase security. Implement **two-factor authentication**, where after entering the first factor (login, password, or another method), the user must confirm their identity using a second factor (phone, email, or WebAuthn). [How to configure two-factor authentication →](./docs-04-box-system-settings.md#two-factor-authentication)

### Management Levels and Publicity of Login Methods { #management-levels-and-publicity }

Login methods can be created in different types of **Encvoy ID** dashboards:

- **Admin Dashboard** — service-wide level;
- **Organization Dashboard** — company level;
- **Application Dashboard (ADM)** — individual application level.

For login methods created at the **service** or **organization** level, you can configure **publicity** — determining exactly where they will be available.

| Login Method Type                            | Publicity Setting | Where Available                              | Management                                       |
| -------------------------------------------- | ----------------- | -------------------------------------------- | ------------------------------------------------ |
| **Created in Admin Dashboard**               | ✔ Yes             | Admin dashboard and all service applications | Managed only from the **Admin Dashboard**        |
| **Created in Organization Dashboard**        | ✔ Yes             | All applications of this organization        | Managed only from the **Organization Dashboard** |
| **Created in Application (Small Dashboard)** | ✘ No              | Only in this application                     | Managed in **Application Settings**              |

---

## Managing Login Methods { #managing-login-methods }

### Creating a New Login Method

For most popular services, **Encvoy ID** provides ready-made templates with settings. They simplify the connection process as they contain pre-filled parameters specific to each provider.

**The configuration process includes three steps:**

1. **Preparation:** obtain `Client ID` and `Client Secret` from the provider service.
2. **Configuration in Encvoy ID:** create a provider of the corresponding type.

   Refer to the separate instruction for configuring the selected provider:
   - **Email**: [Email](./instructions-common-provider-email.md)
   - **Social Networks:** [Google](./instructions-common-provider-google.md), [GitHub](./instructions-common-provider-github.md)
   - **Universal:** [OpenID Connect](./instructions-common-provider-oidc.md) (for any OIDC-compliant systems)
   - **Enhanced Methods:** [mTLS](./instructions-common-provider-mtls.md), [WebAuthn](./instructions-common-provider-webauthn.md), [TOTP](./instructions-common-provider-totp.md), [HOTP](./instructions-common-provider-hotp.md)

3. **Placement on the Widget:** add the login method to the login form available to system users.

### Editing an Existing Login Method

If you need to update the settings of an existing login method (e.g., due to a secret key or domain change):

1. Go to the Admin Dashboard (Organization or corresponding Application settings) → **Settings** section.
2. Click **Configure** in the **Login Methods** block.
3. A window with a list of created login methods will open.
4. Click the **Configure** button on the panel of the login method you want to edit.

<img src="./images/settings-provider-01.webp" alt="Editing a login method in Encvoy ID" style="max-width:500px; width:100%">

5. The editing form will open.
6. Make the necessary changes.
7. Click **Save**.

### Deleting a Login Method

1. Go to the Admin Dashboard (Organization or corresponding Application settings) → **Settings** section.
2. Expand the **Login Methods** block.
3. Click **Configure**.
4. A window with a list of created login methods will open.
5. Click the **Delete** button ![Delete Button](./images/button-delete.webp "Delete Button") located on the panel of the login method you want to delete.

<img src="./images/settings-provider-02.webp" alt="Deleting a login method in Encvoy ID" style="max-width:500px; width:100%">

6. Confirm the action in the modal window.

<img src="./images/settings-provider-03.webp" alt="Confirming login method deletion in Encvoy ID" style="max-width:400px; width:100%">

After successful deletion, the login method will disappear from the widgets of all linked applications.

### Copying Login Method Settings

Copying settings allows you to create a new method based on a previously created one.

1. Copy the login method settings using the **Copy** button ![Copy Button](./images/button-copy.webp "Copy Button") located on the login method panel.

<img src="./images/settings-provider-04.webp" alt="Copying login method settings in Encvoy ID" style="max-width:500px; width:100%">

2. Next, open the creation form for a new login method using a template of the same type and click **Paste** ![Paste Button](./images/button-paste.webp "Paste Button").

> ⚠️ **Note**: If the types do not match, the new provider may not function correctly.

### Configuring a Required Identifier in the User Profile

**Identifiers** are external services that the user has added to their profile or through which they have ever logged into the system.

The list of identifiers available for addition is formed from the login methods in the **Encvoy ID** dashboard with an active publicity setting.

- If a login method is configured as **public**, it will appear in the list of identifiers available for addition in the user profile.
- Placing this login method on the application widget is optional — it can be available in the profile even without a button on the main login screen.
- The user can also add an identifier during login via the widget if such a login method is available.

In **Encvoy ID**, you can configure a requirement for mandatory linking of an external account identifier to the user profile. In this case, when logging into the application, a user who does not have a linked identifier will see a request to add one to their profile.

#### How to Make an Identifier Required

1. Go to the Admin Dashboard (Organization or corresponding Application settings) → **Settings** section.
2. Expand the **Login Methods** block and click **Configure**.
3. A window with a list of created login methods will open.
4. Click the **Make required** button ![Make Required Button](./images/button-required.webp "Make Required Button") on the panel of the login method you want to make mandatory.

<img src="./images/settings-provider-05.webp" alt="Required login method in Encvoy ID user profile" style="max-width:500px; width:100%">

The setting is applied without additional confirmation.

> 💡 **Tip**: Clicking the **Make required** button again will make the identifier in the profile optional.

---

## Login Widget Settings { #login-widget-settings }

### What is the Login Widget?

The **Login Widget** is the authorization form displayed to the user when attempting to log into an application or the **Encvoy ID** system if they are not yet authenticated.

The widget supports:

- classic login via username and password,
- login via various providers,
- flexible configuration of appearance and structure,
- grouping of login methods.

In the widget, login methods are divided into:

- **Primary methods** — displayed as separate buttons under the **Log in** button and are used most frequently.
- **Additional methods** — placed in the **Other providers** block as compact buttons to avoid overloading the interface.

Widget example:

<img src="./images/settings-provider-06.webp" alt="Example of Encvoy ID login widget" style="max-width:400px; width:100%">

> 💡 The **Login Widget** is the first thing a user sees during authorization, so it is important that it matches the company's visual style and is as clear as possible.

### Configuring the Login Widget: Appearance and Buttons

To configure the widget's appearance:

1. Go to the Admin Dashboard (Organization or corresponding Application settings) → **Settings** section.
2. Find the **Login Methods** block and click **Configure**.
3. The **Configure Widget Appearance** window will open.
4. In the first block, key visual elements are defined:
   - **Widget Title** — Displayed at the top of the form. To display the application name in the widget title, use the value `APP_NAME`.
   - **Widget Cover** — Background image of the authorization form.
   - **Cover auto-substitution mode on application widgets**:
     - **Disabled** — The application's cover is used,
     - **Default** — Only for applications without a cover,
     - **Enforced** — Applied to all applications.

5. In the second block, configure the visibility of login form elements:
   - **Show application logo on the widget** — When enabled, displays the logo next to the application name. The image from the [Basic Information](./docs-04-box-system-settings.md#system-name-and-logo) section is used.
   - **Hide create account button** — When enabled, hides the account creation button from the widget.
   - **Hide footer** — When enabled, hides the widget footer with the text "© 2015-2025".
   - **Hide logos of major login providers** — When enabled, hides the login method logos from the **Primary** group.

     <img src="./images/settings-provider-07.webp" alt="Configuring Encvoy ID login widget appearance" style="max-width:300px; width:100%">

6. In the third block, configure button design:
   - **Button background color** — Color scheme for the button background (hex code).
   - **Button font color** — Color scheme for the button text (hex code).

     <img src="./images/settings-provider-08.webp" alt="Configuring Encvoy ID widget button design" style="max-width:300px; width:100%">

7. If necessary, specify text:
   - **Additional information field inside the form** — Additional text that will be displayed at the bottom of the widget,
   - **Additional field outside the widget** — Additional text that will be displayed below the widget.

     <img src="./images/settings-provider-09.webp" alt="Configuring additional text in Encvoy ID login widget" style="max-width:600px; width:100%">

   > The fields support HTML5 code insertion with full semantic markup, including embedded and inline CSS styles. The use of the `script` tag is prohibited. When saving data, any `script` tag (including its content and attributes) will be automatically removed from the field at the database level.

8. Click **Save** to apply changes.

   > 💡 You can view the results of the changes in the **Preview** section.

### Adding and Disabling Login Methods on the Widget

To configure the display of a login method in the widget:

1. Go to the Admin Dashboard (Organization or corresponding Application settings) → **Settings** section.
2. Find the **Login Methods** block and click **Configure**.
3. Enable or disable the toggles for the desired login methods.
4. If necessary, configure login method groups.

> ⚠️ **Note**:
>
> 1. It is impossible to disable the **Login/Password** method. If all login methods are disabled, the **Login/Password** method is automatically enabled, as the widget must have at least one method for logging in.
> 2. Disabling a login method from the widget does not delete the login method from the system.

---

## See Also { #see-also }

- [Application Management](./docs-10-common-app-settings.md) — guide for creating, configuring, and managing OAuth 2.0 and OpenID Connect (OIDC) applications.
- [Organization Management](./docs-02-box-system-install.md) — guide for working with an organization in **Encvoy ID**.
- [User Registration and Login](./docs-13-common-user-authentication.md) — instructions for creating an account, logging in with a username/password, and external authentication services.
