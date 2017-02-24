// @flow
import type EventEmitter from "events";
import type { Subscriber } from "rxjs/Subscriber";

import RxDatabase from "./database";

export class Event {
  type: string;
  source: any;
  error: Error;

  sql: string;
  nsecs: number;

  table: string;
  rowid: number;

  constructor(type: string, source: any) {
    this.type = type;
    this.source = source;
  }
}

export function reports(emitter: EventEmitter, subs: Subscriber, err: Error): boolean {
  if (err) {
    subs.error(err);
    emitter.emit("error", err);
    return false;
  }
  return true;
}

export function error(source: any, error: Error) {
  let e = new Event("error", source);
  e.error = error;
  return e;
}

export function trace(db: RxDatabase, sql: string) {
  let e = new Event("trace", db);
  e.sql = sql;
  return e;
}

export function profile(db: RxDatabase, sql: string, nsecs: number) {
  let e = new Event("profile", db);
  e.sql = sql;
  e.nsecs = nsecs;
  return e;
}

export function update(type: string, db: RxDatabase, table: string, rowid: number) {
  let e = new Event(type, db);
  e.table = table;
  e.rowid = rowid;
  return e;
}
