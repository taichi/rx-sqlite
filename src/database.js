// @flow
import * as sqlite from "sqlite3";
import { Observable } from "rxjs/Observable";
import type { Mode, EventName } from "./index";

import { Event, reports, error, trace, profile } from "./event";
import RxStatement from "./statement";

/**
 * Database Wrapper Object that adds [RxJS 5](https://github.com/ReactiveX/RxJS) API to [sqlite3](https://github.com/mapbox/node-sqlite3/)
 */
export default class RxDatabase {
  db: sqlite.Database;

  /**
   * make new RxDatabase object and open Database.
   * @param filename `":memory:"` or filepath
   * @param mode (Optional) one or combination value of {@link Mode}
   */
  constructor(filename: string, mode?: Mode) {
    this.db = new sqlite.Database(filename, mode);
  }

  /**
   * prepare SQL and bind parameters.
   * @param sql SQL query string.
   * @param params see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback|passing bind parameters}
   */
  prepare(sql: string, ...params: any[]): RxStatement {
    let stmt = this.db.prepare.apply(this.db, [
      sql,
      ...params,
      err => {
        if (err) {
          this.db.on("error", err);
        }
      }
    ]);
    return new RxStatement(stmt);
  }

  /**
   * Binds parameters and executes the query.
   * @param sql SQL query string.
   * @param params see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback|passing bind parameters}
   */
  run<T>(sql: string, ...params: any[]): Observable<T> {
    return toObservable(this.db, this.db.run, sql, params);
  }

  /**
   * Binds parameters and executes the query and retrieves a row.
   * @param sql SQL query string.
   * @param params see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback|passing bind parameters}
   */
  get<T>(sql: string, ...params: any[]): Observable<T> {
    return toObservable(this.db, this.db.get, sql, params);
  }

  /**
   * Binds parameters and executes the query and retrieves all rows at one time.
   * @param sql SQL query string.
   * @param params see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback|passing bind parameters}
   */
  all<T>(sql: string, ...params: any[]): Observable<T[]> {
    return toObservable(this.db, this.db.all, sql, params);
  }

  /**
   * Binds parameters and executes the query and retrieves all rows.
   * @param sql SQL query string.
   * @param params see {@link https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback|passing bind parameters}
   */
  each<T>(sql: string, ...params: any[]): Observable<T> {
    return Observable.create(subs => {
      this.db.each.apply(this.db, [
        sql,
        ...params,
        (err, row) => {
          if (reports(this.db, subs, err)) {
            subs.next(row);
          }
        },
        err => {
          if (reports(this.db, subs, err)) {
            subs.complete();
          }
        }
      ]);
    });
  }

  /**
   * executes the multiple query.
   */
  exec(sql: string): Observable<void> {
    return toObservable(this.db, this.db.exec, sql);
  }

  /**
   * make new specified event stream.
   */
  events(...eventNames: EventName[]): Observable<Event> {
    return Observable.create(subs => {
      let handlers = toHandlers(eventNames, this, subs);
      handlers.forEach(([t, fn]) => this.db.on(t, fn));
      return () => {
        handlers.forEach(([t, fn]) => this.db.removeListener(t, fn));
      };
    });
  }

  /**
   * {@link https://www.sqlite.org/c3ref/busy_timeout.html|Set A Busy Timeout}
   * @param timeout milliseconds of sleeping time
   */
  busyTimeout(timeout: number) {
    if (0 < timeout) {
      this.db.configure("busyTimeout", timeout);
    }
  }

  /**
   * close the Database.
   *
   * you should call this method when you work done
   */
  close() {
    this.db.close();
  }
}

function toObservable(db, fn, sql, params = []) {
  return Observable.create(subs => {
    fn.apply(db, [
      sql,
      ...params,
      (err, vals) => {
        if (reports(db, subs, err)) {
          subs.next(vals);
          subs.complete();
        }
      }
    ]);
  });
}

function toHandlers(names: EventName[], db: RxDatabase, subs) {
  let mapping = {
    error: err => subs.next(error(db, err)),
    open: () => subs.next(new Event("open", db)),
    close: () => subs.next(new Event("close", db)),
    trace: sql => subs.next(trace(db, sql)),
    profile: (sql, nsecs) => subs.next(profile(db, sql, nsecs))
  };
  return names.filter(s => mapping[s]).map(s => [s, mapping[s]]);
}
