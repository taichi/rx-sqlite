# Rx-SQLite

A wrapper library that adds [RxJS 5](https://github.com/ReactiveX/RxJS) API to [sqlite3](https://github.com/mapbox/node-sqlite3/)

## Installation

    npm install rx-sqlite --save

or

    yarn add rx-sqlite

## Usage

```js
import RxDatabase from "rx-sqlite";
import "rxjs";

let sql = `create table users (name text);
    insert into users values ("john");
    insert into users values ("bob");`;

let db = new RxDatabase(":memory:");

db.exec(sql)
  .switchMap(() => db.each("select rowid, name from users"))
  .subscribe(u => console.log(u));
```

## Development

### Setup

    git clone https://github.com/taichi/rx-sqlite
    yarn install
    yarn setup

### Build

    yarn build

## License

```
Copyright 2017 taichi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
