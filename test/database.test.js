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

test.cb("fail to initialize", t => {
  t.plan(1);
  let db = new RxDatabase("::", 20);
  let subs = db
    .events("error")
    .do(e => {
      t.truthy(e.error);
      subs.unsubscribe();
      t.end();
    })
    .subscribe();
});

test.cb("subscribe open", t => {
  t.plan(1);
  let db = new RxDatabase(":memory:");
  let subs = db
    .events("open")
    .do(e => {
      t.truthy(e.type, "open");
    })
    .subscribe(() => {
      subs.unsubscribe();
      db.close();
      t.end();
    });
});

test.cb("Database:events close", t => {
  t.plan(1);
  let db = new RxDatabase(":memory:");
  let subs = db
    .events("close")
    .do(e => {
      t.is(e.type, "close");
      subs.unsubscribe();
      t.end();
    })
    .subscribe();
  db.close();
});

test.cb("Database:run error", t => {
  t.plan(2);
  let db = t.context.db;
  let subs = db
    .events("error")
    .do(e => {
      t.truthy(e.error);
      subs.unsubscribe();
      t.end();
    })
    .subscribe();
  db
    .run("create user ()")
    .catch(err => {
      t.truthy(err, "formal error handling");
      return [err];
    })
    .subscribe(() => {});
});

test("Database:run", t => {
  let sql = "CREATE TABLE lorem (info TEXT)";
  let db = t.context.db;

  t.plan(1);
  return db.run(sql).do(() => {
    t.pass("after run");
  });
});

function track(t, actual) {
  let sql = "CREATE TABLE lorem (info TEXT)";
  let db = t.context.db;
  let end = latch(t, 2, () => {
    subs.unsubscribe();
    t.end();
  });
  let subs = db
    .events(actual)
    .do(e => {
      t.is(e.sql, sql);
    })
    .subscribe(end);
  db
    .run(sql)
    .do(() => {
      t.pass("after run");
    })
    .subscribe(end);
}

test.cb("Database:events trace", track, "trace"); // eslint-disable-line ava/test-ended
test.cb("Database:events profile", track, "profile"); // eslint-disable-line ava/test-ended

function latch(t, plan, complete) {
  t.plan(plan);
  return () => --plan < 1 ? complete() : undefined;
}

test.cb("Database:exec", t => {
  let sql = `CREATE TABLE lorem (json JSON);
    CREATE TABLE lore2 (json JSON);`;
  let db = t.context.db;
  let end = latch(t, 3, () => {
    subs.unsubscribe();
    t.end();
  });
  let subs = db
    .events("trace")
    .do(e => {
      t.truthy(e.sql);
      end();
    })
    .subscribe();
  db
    .exec(sql)
    .do(() => {
      t.pass("after exec");
    })
    .subscribe(end);
});

test("Database:get", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(1);
  return db
    .exec(sql)
    .switchMap(() => {
      return db.get("select name from users");
    })
    .do(u => {
      t.truthy(u);
    });
});

test("Database:all", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(1);
  return db
    .exec(sql)
    .switchMap(() => {
      return db.all("select name from users");
    })
    .do(u => {
      t.is(u.length, 2);
    });
});

test("Database:each", t => {
  let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;
  let db = t.context.db;
  t.plan(2);
  return db
    .exec(sql)
    .switchMap(() => {
      return db.each("select name from users");
    })
    .do(u => {
      t.truthy(u);
    });
});
