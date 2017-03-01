// @flow
import * as sqlite from "sqlite3";
import db from "./database";
import stmt from "./statement";

/**
 * see {@link https://github.com/mapbox/node-sqlite3/wiki/Debugging|node-sqlite3/Debugging}
 */
export function verbose() {
  sqlite.verbose();
}

/**
 * The database is opened in read-only mode.
 */
export const OPEN_READONLY = sqlite.OPEN_READONLY;

/**
 * The database is opened for reading and writing if possible.
 */
export const OPEN_READWRITE = sqlite.OPEN_READWRITE;

/**
 * The database is opened for reading and writing, and is created if it does not already exist.
 */
export const OPEN_CREATE = sqlite.OPEN_CREATE;

/**
 * supported database opening flags
 */
export type Mode = OPEN_READONLY | OPEN_READWRITE | OPEN_CREATE;

/**
 * supported event names
 */
export type EventName = "error" | "open" | "close" | "profile" | "trace";

export default db;
export const RxStatement = stmt;
