declare module "better-sqlite3" {
  type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  type Statement<BindParameters extends unknown[] = unknown[]> = {
    get: (...params: BindParameters) => any;
    all: (...params: BindParameters) => any[];
    run: (...params: BindParameters) => RunResult;
  };

  export default class Database {
    constructor(filename: string);
    exec(sql: string): this;
    prepare<BindParameters extends unknown[] = unknown[]>(
      sql: string
    ): Statement<BindParameters>;
  }
}
