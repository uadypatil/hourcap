import Dexie, { type EntityTable } from "dexie";
import type { AppStateRow, AttendanceRecord, BreakSession, LeaveRecord, User, WorkSession, WorkSettings } from "../types";

class HourCapDB extends Dexie {
  users!: EntityTable<User, "id">;
  settings!: EntityTable<WorkSettings, "id">;
  workSessions!: EntityTable<WorkSession, "id">;
  breakSessions!: EntityTable<BreakSession, "id">;
  attendance!: EntityTable<AttendanceRecord, "id">;
  leaves!: EntityTable<LeaveRecord, "id">;
  appState!: EntityTable<AppStateRow, "key">;
  constructor() {
    super("hourcap");
    this.version(1).stores({
      users: "id",
      settings: "id",
      workSessions: "id, &date, status", // &date enforces one session per date
      breakSessions: "id, workSessionId",
      attendance: "id, &date",
      leaves: "id, &date",
      appState: "key",
    });
  }
}
export const db = new HourCapDB();
