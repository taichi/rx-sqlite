// @flow
import test from "ava";
import RxDatabase from "database";

import "rxjs";

test.beforeEach(t => {
  t.context.db = new RxDatabase(":memory:");
});

test.afterEach(t => {
  t.context.db.close();
});

test.cb("Statement:errors", t => {
  let sql = "create table users (name text not null);";
  let db = t.context.db;
  t.plan(2);
  db.exec(sql)
    .map(() => {
      return db.prepare("insert into users values (null);");
    })
    .do(stmt => {
      let subs = stmt.errors()
        .do(e => {
          t.truthy(e.error);
          subs.unsubscribe();
          t.end();
        })
        .subscribe();
    })
    .switchMap(stmt => stmt.run())
    .catch(err => {
      t.truthy(err, "formal error handling");
      return [err];
    })
    .subscribe();
});

test("Statement:run", t => {
  let db = t.context.db;
  let stmt = db.prepare("create table users (name text);");
  t.plan(1);
  return stmt.run()
    .do(() => {
      t.pass();
    });
});

test("Statement:get", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(1);
  return db.exec(sql)
    .switchMap(() => {
      return db.prepare("select name from users").get();
    })
    .do(u => {
      t.is(u.name, "john");
    });
});

test("Statement:all", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(2);
  return db.exec(sql)
    .switchMap(() => {
      return db.prepare("select name from users").all();
    })
    .do(u => {
      t.is(2, u.length);
      t.is(u[0].name, "john");
    });
});

test("Statement:each", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(2);
  return db.exec(sql)
    .switchMap(() => {
      return db.prepare("select name from users").each();
    })
    .do(u => {
      t.truthy(u);
    });
});

test("Statement:prepare", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(1);
  return db.exec(sql)
    .map(() => {
      return db
        .prepare("select rowid, name from users where name = ?", "john");
    })
    .switchMap(stmt => {
      return stmt.get();
    })
    .do(u => {
      t.is(u.name, "john");
    });
});

test("Statement:bind", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(1);
  return db.exec(sql)
    .switchMap(() => {
      return db
        .prepare("select rowid, name from users where name = ?")
        .bind("john");
    })
    .switchMap(stmt => {
      return stmt.get();
    })
    .do(u => {
      t.is(u.name, "john");
    });
});

test("Statement:reset", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(1);
  return db.exec(sql)
    .switchMap(() => {
      return db
        .prepare("select rowid, name from users where name = ?")
        .bind("john");
    })
    .switchMap(stmt => {
      return stmt.reset();
    })
    .switchMap(stmt => {
      return stmt.get();
    })
    .do(u => {
      t.is(u.name, "john");
    });
});
