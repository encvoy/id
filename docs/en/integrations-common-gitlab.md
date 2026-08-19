---
title: "GitLab integration with Encvoy ID — setting up single sign-on"
description: "Learn how to set up single sign-on for GitLab via Encvoy ID: simple configuration, data protection, and convenient access for all company employees."
keywords:
  - GitLab integration with Encvoy ID
  - GitLab Encvoy ID
  - GitLab SSO
  - GitLab single sign-on
  - SSO login to GitLab
  - single sign-on in GitLab
  - GitLab authentication
  - GitLab authorization
  - GitLab OAuth authentication
  - login to GitLab via Encvoy ID
  - configuring GitLab with Encvoy ID
  - connecting GitLab to Encvoy ID
  - single sign-on in gitlab
author: "The Encvoy ID Team"
date: 2025-12-12
updated: 2025-12-22
product: [box, github, service]
region: [ru, en]
menu_title: "Integration with GitLab"
---

# How to configure GitLab integration with Encvoy ID

In this guide, you will learn how to set up single sign-on (SSO) in **GitLab** via the **Encvoy ID** system.

> 📌 [GitLab](https://about.gitlab.com/) is a web-based platform for managing projects and software code repositories, based on the popular **Git** version control system.

Setting up login via **Encvoy ID** consists of several key stages performed in two different systems.

- [Step 1. Create application](#step-1-create-application)
- [Step 2. Configure GitLab system](#step-2-configure-gitlab)
- [Step 3. Verify integration](#step-3-verify-integration)

---

## Step 1. Create application { #step-1-create-application }

1. Log in to the **Encvoy ID** system.
2. Create an application with the following settings:
   - **Application Address** - the address of your **GitLab** installation;
   - **Redirect URL \#1 (`Redirect_uri`)** - `<GitLab installation address>/users/auth/oauth2_generic/callback`.

   > 🔍 For more details on creating applications, read the [instructions](./docs-10-common-app-settings.md#creating-application).

3. Open the [application settings](./docs-10-common-app-settings.md#editing-application) and copy the values of the following fields:
   - **Identifier** (`Client_id`),
   - **Secret key** (`client_secret`).

---

## Step 2. Configure GitLab system { #step-2-configure-gitlab }

Configuring user authorization for the **GitLab** service via **Encvoy ID** is done in the **GitLab gitlab.rb** configuration file, located in the service configuration folder (/config).

1. Open the **gitlab.rb** configuration file in edit mode and navigate to the **OmniAuth Settings** block.
2. Set the following values for the parameters:

   ```bash
       gitlab_rails['omniauth_enabled'] = true
       gitlab_rails['omniauth_allow_single_sign_on'] = ['oauth2_generic', '<Encvoy IDSystemName>']
       gitlab_rails['omniauth_block_auto_created_users'] = false

       The value for gitlab_rails['omniauth_providers'] should look as follows:

       gitlab_rails['omniauth_providers'] = [
       {
       'name' => 'oauth2_generic',
       'app_id' => '<Client_id of the application created in Encvoy ID>',
       'app_secret' => '<Client_secret of the application created in Encvoy ID>',
       'args' => {
       client_options: {
       'site' => 'https://<Encvoy ID system address>/',
       'authorize_url' => '/api/oidc/auth',
       'user_info_url' => '/api/oidc/me',
       'token_url' => '/api/oidc/token'
       },
       user_response_structure: {
       root_path: [],
       id_path: ['sub'],
       attributes: { email:'email',  name:'nickname' },
       },
       scope: 'openid profile email',
       'name' => '<Encvoy IDSystemName>’
       }
       }
       ]
   ```

   <img src="./images/integrations-gitlab-01.webp" alt="GitLab configuration file setup" style="max-width:600px; width:100%">

3. Restart the **GitLab** service to apply the new settings.
4. If necessary, log in as an administrator to the **GitLab** service interface. Navigate to the settings path **Admin (Admin Area) — Settings-General**.

   On the page that opens, in the **Sign-in restrictions** block, check the box next to <Encvoy IDSystemName> in the **Enabled OAuth authentication sources** sub-block.

   <img src="./images/integrations-gitlab-02.webp" alt="GitLab admin panel setup" width="80%">

---

## Step 3. Verify integration { #step-3-verify-integration }

1. Open the **GitLab** login page.
2. Ensure that the **Login via Encvoy ID** button has appeared.
3. Click the button and log in using your corporate account:
   - The system will redirect you to the **Encvoy ID** authentication page.
   - Enter your corporate credentials.

    <img src="./images/integrations-gitlab-03.webp" alt="GitLab login widget" style="max-width:600px; width:100%">

4. After successful authentication, you should be redirected back to **GitLab** and automatically logged into your account.
