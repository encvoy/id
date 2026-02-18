# Widget UMD Integration Guide

## Using via script tag

### 1. Widget Integration

The self-contained UMD build includes all necessary dependencies (React, Material-UI, Emotion):

```html
<script src="path/to/widget-umd.js"></script>
```

**No need to include additional dependencies!**

### 2. Automatic Mounting

Create a div with id="auth-widget" and data attributes:

```html
<div
  id="auth-widget"
  data-app-id="your-app-id"
  data-backend-url="https://your-backend.com"
  data-redirect-url="https://your-redirect-url.com"
  data-issuer="https://id.kloud.one"
  data-without-homepage="false"
></div>
```

The widget will automatically mount to this element when the page loads.

### 3. Manual API Usage

```javascript
// Create a widget instance
const widget = window.Widget.create({
  appId: "your-app-id",
  backendUrl: "https://your-backend.com",
  redirectUrl: "https://your-redirect-url.com",
  issuer: "https://id.encvoy.es",
  withOutHomePage: false,
});

// Mount to an element
widget.mount("my-widget-container");

// Unmount
widget.unmount();

// Full removal
widget.destroy();
```

## Configuration

### Required Parameters

- `appId` - Application ID
- `backendUrl` - Backend URL
- `redirectUrl` - Redirect URL after authorization

### Optional Parameters

- `issuer` - OIDC provider URL (default: "https://id.kloud.one")
- `withOutHomePage` - Automatic authorization without a homepage
- `scopes` - Authorization scopes
- `profile` - Profile display settings
- `loginButton` - Login button settings
- `customStyles` - Custom styles

## Build

```bash
# Regular build (ESM/CJS) and UMD
npm run build
```

## File Size

- `widget-umd.js` - ~2.3MB (self-contained build with React + Material-UI)
- `widget-umd.js.map` - ~3.9MB (source map for debugging)

## Testing

Open `test.html` in a browser to verify functionality.

## Full Integration Example

### Minimal HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Site</title>
  </head>
  <body>
    <!-- Element for the widget -->
    <div
      id="auth-widget"
      data-app-id="my-app"
      data-backend-url="https://api.mysite.com"
      data-redirect-url="https://mysite.com/callback"
    ></div>

    <!-- Include the widget -->
    <script src="widget-umd.js"></script>
  </body>
</html>
```

The widget will automatically initialize and start working!

## Troubleshooting

1. **"Widget API not found"** - Ensure the `widget-umd.js` file is loading without errors
2. **Console errors** - Check the correctness of the data attributes
3. **Widget not displaying** - Ensure the element with `id="auth-widget"` exists
4. **Network errors** - Check the availability of the specified URLs in the configuration
