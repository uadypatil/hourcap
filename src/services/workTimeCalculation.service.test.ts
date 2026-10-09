import { describe, expect, it } from "vitest";
import * as c from "./workTimeCalculation.service";

const at = (h: number, m: number) => new Date(2026, 9, 8, h, m).toISOString();
describe("work time calculation (spec §48)", () => {
  const brk = [{ startedAt: at(12, 0), endedAt: at(12, 30) }];
  it("computes worked/remaining/completion", () => {
    const now = Date.parse(at(15, 30));
    const worked = c.calculateWorkedMinutes(at(8, 17), now, brk);
    expect(c.formatDuration(worked)).toBe("06h 43m");
    expect(c.formatDuration(c.calculateRemainingMinutes(510, worked))).toBe("01h 47m");
    const done = c.calculateExpectedCompletion(at(8, 17), 510, c.calculateBreakMinutes(brk, now));
    expect([done.getHours(), done.getMinutes()]).toEqual([17, 17]);
  });
  it("counts open break and multiple breaks", () => {
    const b = [{ startedAt: at(12, 10), endedAt: at(12, 30) }, { startedAt: at(15, 45), endedAt: at(16, 0) }, { startedAt: at(17, 30) }];
    expect(c.calculateBreakMinutes(b, Date.parse(at(17, 40)))).toBe(45);
  });
  it("overtime, shortfall, half day", () => {
    expect(c.calculateOvertime(522, 510)).toBe(12);
    expect(c.calculateShortfall(468, 510)).toBe(42);
    expect(c.calculateHalfDayDuration(510)).toBe(255);
    expect(c.calculateHalfDayDuration(510, 240)).toBe(240);
  });
});
