// @flow
import * as sqlite from "sqlite3";
import { Observable } from "rxjs/Observable";
import type { Mode } from "./index";

import { Event, reports, error, trace, profile } from "./event";
import RxStatement from "./statement";

export default class RxDatabase {

  db: sqlite.Database;

  constructor(filename: string, mode?: Mode) {
    this.db = new sqlite.Database(filename, mode);
  }

  prepare(sql: string, ...params: any[]): RxStatement {
    let stmt = this.db.prepare.apply(this.db, [sql, ...params, err => {
      if (err) {
        this.db.on("error", err);
      }
    }]);
    return new RxStatement(stmt);
  }

  run<T>(sql: string, ...params: any[]): Observable<T> {
    return toObservable(this.db, this.db.run, sql, params);
  }

  get<T>(sql: string, ...params: any[]): Observable<T> {
    return toObservable(this.db, this.db.get, sql, params);
  }

  all<T>(sql: string, ...params: any[]): Observable<T> {
    return toObservable(this.db, this.db.all, sql, params);
  }

  each<T>(sql: string, ...params: any[]): Observable<T> {
    return Observable.create(subs => {
      this.db.each.apply(this.db, [sql, ...params, (err, row) => {
        if (reports(this.db, subs, err)) {
          subs.next(row);
        }
      }, err => {
        if (reports(this.db, subs, err)) {
          subs.complete();
        }
      }]);
    });
  }

  exec(sql: string): Observable<void> {
    return toObservable(this.db, this.db.exec, sql);
  }

  events(...eventNames: string[]): Observable<Event> {
    return Observable.create(subs => {
      let handlers = toHandlers(eventNames, this, subs);
      handlers.forEach(([t, fn]) => this.db.on(t, fn));
      return () => {
        handlers.forEach(([t, fn]) => this.db.removeListener(t, fn));
      };
    });
  }

  busyTimeout(timeout: number) {
    if (0 < timeout) {
      this.db.configure("busyTimeout", timeout);
    }
  }

  close() {
    this.db.close();
  }
}

function toObservable(db, fn, sql, params = []) {
  return Observable.create(subs => {
    fn.apply(db, [sql, ...params, (err, vals) => {
      if (reports(db, subs, err)) {
        subs.next(vals);
        subs.complete();
      }
    }]);
  });
}

function toHandlers(names: string[], db: RxDatabase, subs) {
  let mapping = {
    error: err => subs.next(error(db, err)),
    open: () => subs.next(new Event("open", db)),
    close: () => subs.next(new Event("close", db)),
    trace: sql => subs.next(trace(db, sql)),
    profile: (sql, nsecs) => subs.next(profile(db, sql, nsecs))
  };
  return names.filter(s => mapping[s]).map(s => [s, mapping[s]]);
}

