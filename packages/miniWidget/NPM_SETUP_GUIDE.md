# Widget Installation and Setup Guide

## Installation on the Client (UI)

```bash
npm install widget
# or
yarn add widget
```

## Widget Configuration

### Configuration Parameters

#### Required Parameters

| Parameter     | Type     | Description                             | Example                         |
| ------------- | -------- | --------------------------------------- | ------------------------------- |
| `appId`       | `string` | Unique application identifier           | `"MTnOOTdx85FgNbOFy2nUsH"`      |
| `backendUrl`  | `string` | URL of your backend API                 | `"http://localhost:3001"`       |
| `redirectUrl` | `string` | URL for redirection after authorization | `"http://localhost:3000/login"` |

#### Optional Parameters

| Parameter             | Type                  | Description                         | Default Value                 |
| --------------------- | --------------------- | ----------------------------------- | ----------------------------- |
| `issuer`              | `string`              | URL of the SSO server               | `"https://id.encvoy.es"`      |
| `withOutHomePage`     | `boolean`             | Automatic redirect to authorization | `false`                       |
| `getTokenEndPoint`    | `string`              | Endpoint for obtaining a token      | `"/api/oidc/token"`           |
| `getUserInfoEndPoint` | `string`              | Endpoint for obtaining user data    | `"/api/oidc/me"`              |
| `scopes`              | `string[]`            | OAuth2 scopes                       | `["openid", "lk", "profile"]` |
| `profile`             | `IProfileConfig`      | User profile settings               | See section below             |
| `loginButton`         | `ICustomMenuButton`   | Login button settings               | See section below             |
| `menuButtons`         | `ICustomMenuButton[]` | Array of additional buttons         | See section below             |
| `customStyles`        | `ICustomStyles`       | Global widget styles                | See section below             |

```typescript
import { Widget, WidgetConfig } from "widget";

const newConfig: WidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  issuer: "https://id.encvoy.es",
  withOutHomePage: false,
  getTokenEndPoint: "/api/oidc/token",
  getUserInfoEndPoint: "/api/oidc/me",
};

// Using the component
<Widget config={newConfig} />;
```

### User Profile Settings (profile)

#### Profile Configuration Parameters

| Parameter    | Type               | Description                             | Default Value      |
| ------------ | ------------------ | --------------------------------------- | ------------------ |
| `isHideText` | `boolean`          | Hide the display of the username        | `false`            |
| `wrapper`    | `IComponentStyles` | Profile container styles (colors only)  | See styles section |
| `button`     | `IComponentStyles` | User avatar button styles (colors only) | See styles section |

> ⚠️ **Important:** For profile settings (`profile.wrapper` and `profile.button`), only colors (`color.text`, `color.background`, `color.hover`) and hiding the username (`isHideText`) can be modified. Other styling parameters (such as `borderRadius`, `padding`, `position`) do not apply to the profile.

#### Profile Configuration Example

```typescript
const config: WidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Avatar only without text
  profile: {
    isHideText: true, // Hide username
  },
};
```

### Login Button Settings (loginButton)

#### Login Button Parameters

| Parameter      | Type                           | Description                  | Default Value      |
| -------------- | ------------------------------ | ---------------------------- | ------------------ |
| `text`         | `string`                       | Login button text            | `"Login"`          |
| `type`         | `string`                       | Button type                  | `"login"`          |
| `icon`         | `string \| React.ReactElement` | Image URL or React element   | `null`             |
| `customStyles` | `IComponentStyles`             | Custom styles for the button | See styles section |

#### Login Button Configuration Example

```typescript
const config: WidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Settings for unauthenticated users' login button
  loginButton: {
    text: "Login via ",
    type: "login",
    icon: "https://id.encvoy.es/favicon.ico", // Custom icon
  },
};
```

#### Example of a Login Button without an Icon

```typescript
const config: WidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  // Simple button with text only
  loginButton: {
    text: "Login",
    type: "login",
    customStyles: {
      isHideIcon: true, // Hide icon
    },
  },
};
```

### Menu Buttons Parameters (menuButtons)

#### Required Parameters for menuButtons

| Parameter | Type     | Description                     | Example              |
| --------- | -------- | ------------------------------- | -------------------- |
| `text`    | `string` | Displayed button name           | `"TestService"`      |
| `link`    | `string` | Link to the page for navigation | `"https://test.com"` |

#### Optional Parameters for menuButtons

| Parameter      | Type                           | Description                  | Default Value      |
| -------------- | ------------------------------ | ---------------------------- | ------------------ |
| `icon`         | `string \| React.ReactElement` | Image URL or React element   | `null`             |
| `customStyles` | `IComponentStyles`             | Custom styles for the button | See styles section |

### Configuration Example

```typescript
import { Widget, WidgetConfig } from "widget";

const newConfig: WidgetConfig = {
  appId: "MTnOOTdx85FgNbOFy2nUsH",
  backendUrl: "http://localhost:3001",
  redirectUrl: "http://localhost:3000/login",
  menuButtons: [
    {
      text: "TestService",
      link: "https://test.com",
      icon: "https://image.png", // | <Icon />
    },
  ],
};
```

## Widget Styling System

In the `WidgetConfig` object, you can define the appearance of all widget elements through the `customStyles` property. This allows flexible management of colors, rounding, and content alignment without changing the component code.

#### Appearance Configuration

| Parameter      | Type            | Description                          |
| -------------- | --------------- | ------------------------------------ |
| `customStyles` | `ICustomStyles` | Styling object for the entire widget |

### Custom Styles Parameters (customStyles)

#### Global Styles

| Parameter             | Type               | Description                      | Example   |
| --------------------- | ------------------ | -------------------------------- | --------- |
| `global.borderRadius` | `string`           | Corner rounding for all elements | `"12px"`  |
| `global.color`        | `IComponentStyles` | Global colors                    | See below |

#### Component Styles

| Parameter                    | Type               | Description                    | Purpose                    |
| ---------------------------- | ------------------ | ------------------------------ | -------------------------- |
| `components.primaryButton`   | `IComponentStyles` | Style for the primary button   | "Login", "Profile" buttons |
| `components.secondaryButton` | `IComponentStyles` | Style for the secondary button | "Logout" button            |
| `components.accountButton`   | `IComponentStyles` | Style for account menu buttons | Buttons in dropdown menu   |

#### IComponentStyles Parameters

| Parameter          | Type                 | Description                     | Example      |
| ------------------ | -------------------- | ------------------------------- | ------------ |
| `color.text`       | `string`             | Text and icon color (HEX)       | `"#ffffff"`  |
| `color.background` | `string`             | Background color (HEX)          | `"#1976d2"`  |
| `color.hover`      | `string`             | Hover background color (HEX)    | `"#1565c0"`  |
| `borderRadius`     | `string`             | Element corner rounding         | `"8px"`      |
| `padding`          | `string`             | Inner padding                   | `"8px 16px"` |
| `position`         | `"left" \| "center"` | Content alignment in the button | `"center"`   |
| `isHideIcon`       | `boolean`            | Hide the icon in the button     | `false`      |

### Inheriting Styles for secondaryButton

...
