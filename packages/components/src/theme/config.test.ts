import { describe, expect, it } from "vitest";
import {
  DEFAULT_SYSTEM_STYLE,
  DEFAULT_THEME_CONFIG,
  normalizeSystemStyle,
  normalizeThemeConfig,
} from "./config";

describe("normalizeSystemStyle", () => {
  it("uses defaults for malformed values", () => {
    expect(normalizeSystemStyle(null)).toEqual(DEFAULT_SYSTEM_STYLE);
  });

  it("preserves supported values", () => {
    expect(
      normalizeSystemStyle({
        component: { borderRadius: "8px" },
        button: { borderRadius: "12px" },
        contentPosition: "center",
        surfaceBlock: {
          borderWidth: "2px",
          hideBorder: true,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
      })
    ).toEqual({
      component: { borderRadius: "8px" },
      button: { borderRadius: "12px" },
      contentPosition: "center",
      surfaceBlock: {
        borderWidth: "2px",
        hideBorder: true,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      },
    });
  });
});

describe("normalizeThemeConfig", () => {
  it("returns a complete default contract for an unknown input", () => {
    expect(normalizeThemeConfig(undefined)).toEqual(DEFAULT_THEME_CONFIG);
  });

  it("normalizes missing palette fields independently", () => {
    const result = normalizeThemeConfig({
      themeLight: { primary: { main: "#000000" } },
      themeDark: { background: { default: "#101010" } },
    });

    expect(result.themeLight.primary.main).toBe("#000000");
    expect(result.themeLight.primary.contrastText).toBe("#FFFFFF");
    expect(result.themeDark.background.default).toBe("#101010");
    expect(result.themeDark.text.primary).toBe("#0B1641");
  });
});
