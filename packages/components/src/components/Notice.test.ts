import {describe, expect, it} from "vitest";
import {formatNoticeTimestamp} from "./Notice";

describe("formatNoticeTimestamp", () => {
  it("formats a timestamp from today as time only", () => {
    const now = new Date(2026, 7, 5, 16, 30);
    const timestamp = new Date(2026, 7, 5, 9, 7).toISOString();

    expect(formatNoticeTimestamp(timestamp, "en-GB", now)).toBe("09:07");
  });

  it("includes the full date for another month with the same day", () => {
    const now = new Date(2026, 7, 5, 16, 30);
    const timestamp = new Date(2026, 6, 5, 9, 7).toISOString();

    expect(formatNoticeTimestamp(timestamp, "en-GB", now)).toContain(
      "05/07/2026"
    );
  });

  it("does not render an invalid timestamp", () => {
    expect(formatNoticeTimestamp("not-a-date", "en-GB")).toBeNull();
  });
});
