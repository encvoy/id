import { CssBaseline, ThemeProvider } from "@mui/material";
import type { Preview } from "@storybook/react-vite";
import { createAppTheme } from "../src/theme";
import "../src/styles.css";

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <ThemeProvider
        key={context.globals.colorScheme}
        theme={createAppTheme()}
        defaultMode={context.globals.colorScheme}
      >
        <CssBaseline />
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  globalTypes: {
    colorScheme: {
      description: "MUI color scheme",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: ["light", "dark"],
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
