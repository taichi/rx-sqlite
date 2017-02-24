// @flow
import * as sqlite from "sqlite3";
import db from "./database";
import stmt from "./statement";

export function verbose() {
  sqlite.verbose();
}

export const OPEN_READONLY = sqlite.OPEN_READONLY;
export const OPEN_READWRITE = sqlite.OPEN_READWRITE;
export const OPEN_CREATE = sqlite.OPEN_CREATE;

export type Mode = OPEN_READONLY | OPEN_READWRITE | OPEN_CREATE;

export default db;
export const RxStatement = stmt;

