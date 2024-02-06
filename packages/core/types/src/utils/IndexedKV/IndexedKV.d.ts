/**
* @description
* IndexedKV is a wrapper around IndexedDB that provides a simple interface for
* storing and retrieving data.
*/
import { IndexedKVOptions } from './IndexedKV.d';
declare class IndexedKV {
    readyResolver?: Function;
    db?: IDBDatabase;
    version?: number;
    openDatabaseIterations: number;
    IndexedKVReadyFlag: Promise<boolean>;
    options: IndexedKVOptions;
    constructor(options: IndexedKVOptions);
    openDataBase: (version?: number) => void;
    /**
     * Similar to "Select * WHERE $regex" implementation
     * Matches the key against the regex and returns the value
     *
     * @param regex {Regular expression matcher}
     * @param {Function=} callback
     * @returns {Promise<Array<IDBRequest["result"]>>}
     */
    openCursor(regex: RegExp, callback?: Function): Promise<Array<{
        value: IDBCursorWithValue | unknown;
        key: string;
    }>>;
    batchSet(items: Array<{
        key: IDBValidKey;
        value: string | number | boolean | object | Array<any>;
    }>): Promise<void>;
    /**
     * setItem will add or replace an entry by key
     *
     * @param {string | number} key
     * @param {StructuredCloneData} value
     * @returns {Promise<IDBValidKey>}
     */
    setItem(key: IDBValidKey, value: string | number | boolean | object | Array<any>): Promise<IDBRequest["result"]>;
    /**
     * @description
     * Add an item to the database
     *
     * @param {string | number} key
     * @param {StructuredCloneData} value
     * @returns {Promise<IDBValidKey | IDBRequest["result"]>}
     */
    add(key: IDBValidKey, value: string | number | boolean | object | Array<any>): Promise<IDBRequest["result"]>;
    /**
     * @description
     * Get an item from the database
     *
     * @param {string | number} key
     * @returns
     */
    getItem(key: IDBValidKey): Promise<IDBRequest["result"] | null>;
    /**
     *@description
     * Get all items from the database
     *
     * @returns {Promise<Array<any> | null>}
     */
    getAll(): Promise<IDBRequest["result"][]>;
    /**
     * @description
     * Remove an item from the database
     *
     * @param {string | number} key
     * @returns {Promise<boolean>}
     */
    removeItem(key: IDBValidKey): Promise<boolean>;
}
export { IndexedKV };
