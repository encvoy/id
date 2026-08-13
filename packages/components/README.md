# @encvoy-id/components

Shared component library for identity applications.

## Usage

```tsx
import { Card, SurfaceBlock } from "@encvoy-id/components";
import {
  createAppTheme,
  DEFAULT_THEME_CONFIG,
} from "@encvoy-id/components/theme";
import "@encvoy-id/components/styles.css";
```

Applications own their Redux, Router, i18n and API bootstrap. The library only
contains reusable presentation components and the typed MUI theme contract.

Dashboard settings are adapted to `ThemeConfig` in Dashboard itself;
the package does not depend on backend settings types or serialized JSON.

## Development

```sh
npm run type-check
npm test
npm run build
npm run storybook
npm run build-storybook
```

React, MUI, Emotion and form/date/phone integrations are peer dependencies and
must be provided by the consuming application.
