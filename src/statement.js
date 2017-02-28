// @flow
import { Observable } from "rxjs/Observable";
import type { Statement } from "sqlite3";

import { Event, reports, error } from "./event";

export default class RxStatement {
  stmt: Statement;

  constructor(stmt: Statement) {
    this.stmt = stmt;
  }

  errors(): Observable<Event> {
    return Observable.create(subs => {
      let fn = err => subs.next(error(this, err));
      let t = "error";
      this.stmt.on(t, fn);
      return () => {
        this.stmt.removeListener(t, fn);
      };
    });
  }

  run<T>(...params: any[]): Observable<T> {
    return toObservable(this, this.stmt.run, params);
  }

  get<T>(...params: any[]): Observable<T> {
    return toObservable(this, this.stmt.get, params);
  }

  all<T>(...params: any[]): Observable<T> {
    return toObservable(this, this.stmt.all, params);
  }

  each<T>(...params: any[]): Observable<T> {
    return Observable.create(subs => {
      this.stmt.each.apply(this.stmt, [
        ...params,
        (err, row) => {
          if (reports(this.stmt, subs, err)) {
            subs.next(row);
          }
        },
        err => {
          if (reports(this.stmt, subs, err)) {
            subs.complete();
          }
        }
      ]);
      return () => {
        this.stmt.finalize();
      };
    });
  }

  bind(...params: any[]): Observable<RxStatement> {
    return Observable.create(subs => {
      this.stmt.bind.apply(this.stmt, [...params, toOnceCallback(this, subs)]);
    });
  }

  reset(): Observable<RxStatement> {
    return Observable.create(subs => {
      this.stmt.reset(toOnceCallback(this, subs));
    });
  }

  finalize(): Observable<RxStatement> {
    return Observable.create(subs => {
      this.stmt.finalize(toOnceCallback(this, subs));
    });
  }
}

function toOnceCallback(rxs: RxStatement, subs) {
  return err => {
    if (reports(rxs.stmt, subs, err)) {
      subs.next(rxs);
      subs.complete();
    }
  };
}

function toObservable(rxs: RxStatement, stmtFn, params = []) {
  return Observable.create(subs => {
    stmtFn.apply(rxs.stmt, [
      ...params,
      (err, vals) => {
        if (reports(rxs.stmt, subs, err)) {
          subs.next(vals);
          subs.complete();
        }
      }
    ]);
    return () => {
      rxs.stmt.finalize(err => {
        if (err) {
          rxs.stmt.emit("error", err);
        }
      });
    };
  });
}
