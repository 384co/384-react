export type IndexedKVOptions = { db: string; table: string; }

declare class IndexedKV {
    constructor(options: IndexedKVOptions);
    readyResolver?: Function;
    db?: IDBDatabase;
    version?: number;
    openDatabaseIterations: number = 0;
    IndexedKVReadyFlag: Promise<boolean> = new Promise((resolve) => {
        this.readyResolver = resolve;
    });
    options: IndexedKVOptions = {
        db: 'MyDB',
        table: 'default'
    };
    openDataBase: (version?: number) => void;
    openCursor(regex: RegExp, callback?: Function): Promise<Array<{ value: IDBCursorWithValue | unknown, key: string }>>
    batchSet(items: Array<{ key: IDBValidKey, value: string | number | boolean | object | Array<any> }>): Promise<void>;
    setItem(key: IDBValidKey, value: string | number | boolean | object | Array<any>) : Promise<IDBRequest["result"]>
    add(key: IDBValidKey, value: string | number | boolean | object | Array<any>): Promise<IDBRequest["result"]>
    getItem(key: IDBValidKey): Promise<IDBRequest["result"] | null>
    getAll(): Promise<IDBRequest["result"][]>
    removeItem(key: IDBValidKey): Promise<boolean>

}