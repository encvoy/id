import { describe, expect, it } from "vitest";
import {
  addSearchHistoryEntry,
  parseSearchHistory,
  readSearchHistory,
} from "./useSearchHistory";

describe("search history", () => {
  it("returns an empty list for missing or damaged storage values", () => {
    expect(parseSearchHistory(null)).toEqual([]);
    expect(parseSearchHistory("not-json")).toEqual([]);
    expect(parseSearchHistory('{"value":"query"}')).toEqual([]);
  });

  it("does not require window or localStorage", () => {
    expect(readSearchHistory("searchHistory:test")).toEqual([]);
  });

  it("normalizes stored values and limits history to eight entries", () => {
    expect(
      parseSearchHistory(
        JSON.stringify([
          " first ",
          null,
          "",
          "second",
          "third",
          "fourth",
          "fifth",
          "sixth",
          "seventh",
          "eighth",
          "ninth",
        ]),
      ),
    ).toEqual([
      "first",
      "second",
      "third",
      "fourth",
      "fifth",
      "sixth",
      "seventh",
      "eighth",
    ]);
  });

  it("ignores short values and moves an existing value to the front", () => {
    const history = ["Alpha", "Beta"];

    expect(addSearchHistoryEntry(history, "a")).toBe(history);
    expect(addSearchHistoryEntry(history, " beta ")).toEqual(["beta", "Alpha"]);
  });
});
