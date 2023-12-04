import { Ready } from './Decorators'
/**
* @description
* IndexedKV is a wrapper around IndexedDB that provides a simple interface for
* storing and retrieving data.
*/

type IndexedKVOptions = { db: string; table: string; }


class IndexedKV {
    readyResolver: Function | undefined;
    db: IDBDatabase | undefined;
    version: number | undefined;
    openDatabaseIterations: number = 0;
    IndexedKVReadyFlag: Promise<boolean> = new Promise((resolve) => {
        this.readyResolver = resolve;
    });
    options: IndexedKVOptions = {
        db: 'MyDB',
        table: 'default'
    };
    constructor(options: IndexedKVOptions) {

        this.options = Object.assign(this.options, options);
        if (!globalThis.indexedDB) {
            throw new Error("Your browser doesn't support a stable version of IndexedDB.");
        }
        this.openDataBase();
    }

    openDataBase = (version: undefined | number = undefined) => {
        this.openDatabaseIterations++;
        console.log(`Opening database ${this.options.db}... version ${version ? version : 0}`)
        const openReq = globalThis.indexedDB.open(this.options.db, version);
        openReq.onerror = event => {
            console.error("Database error: " + event);
        };
        openReq.onsuccess = () => {
            this.db = openReq.result;
            const version = this.db.version;
            console.log(`Database version: {${version}  ${this.options.db} ${this.options.table}}`);
            // this.version = version;
            if (this.db.objectStoreNames.contains(this.options.table)) {
                console.log(`Object store '${this.options.table}' exists in the database.`);
                if (this.readyResolver) {
                    this.readyResolver(true);
                }
                this.openDatabaseIterations = 0;
            } else {
                if(this.openDatabaseIterations > 1){
                    throw new Error(`Object store '${this.options.table}' does not exist in the database. Aborting...`);
                }else{
                    this.db.close();
                    console.log(`Object store '${this.options.table}' does not exist in the database. Upgrading schema...`);
                    this.openDataBase(version + 1);
                }
            }
        };
        openReq.onupgradeneeded = () => {
            this.db = openReq.result;
            this.db.createObjectStore(this.options.table, { keyPath: "key" });
        };
    }

    /**
     * Similar to "Select * WHERE $regex" implementation
     * Matches the key against the regex and returns the value
     *
     * @param regex {Regular expression matcher}
     * @param {Function=} callback
     * @returns {Promise<Array<IDBRequest["result"]>>}
     */
    openCursor(regex: RegExp, callback?: Function): Promise<Array<{ value: IDBCursorWithValue | unknown, key: string }>> {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table], "readonly");
                    const objectStore = transaction.objectStore(this.options.table);
                    const request: IDBRequest = objectStore.openCursor(null, 'next');
                    let returnArray: Array<{ value: IDBCursorWithValue, key: string }> = [];
                    request.onsuccess = function () {
                        const cursor: IDBCursorWithValue | null = request.result;
                        if (cursor) {
                            if (String(cursor.key).match(regex)) {
                                returnArray.push({ value: cursor.value.value, key: cursor.value.key });
                            }
                            cursor.continue();
                        }
                        else {
                            if (callback) {
                                callback(returnArray);
                            }
                            resolve(returnArray);
                        }
                    };
                }
                else {
                    reject('DB is not defined');
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     * setItem will add or replace an entry by key
     *
     * @param {string | number} key
     * @param {StructuredCloneData} value
     * @returns {Promise<IDBValidKey>}
     */

    @Ready
    setItem(key: IDBValidKey, value: string | number | boolean | object | Array<any>) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {

                    const objectStore = this.db.transaction([this.options.table], "readwrite").objectStore(this.options.table);
                    const request: IDBRequest = objectStore.get(key);
                    request.onerror = event => {
                        reject(event);
                    };
                    request.onsuccess = () => {
                        const data = request.result;
                        if (data?.value) {
                            //Data exists we update the value
                            data.value = value;
                            try {
                                const requestUpdate = objectStore.put(data);
                                requestUpdate.onerror = (event) => {
                                    reject(event);
                                };
                                requestUpdate.onsuccess = () => {
                                    resolve(requestUpdate.result);
                                };
                            } catch (e) {
                                console.error(e);
                            }
                        }
                        else {
                            const requestAdd = objectStore.add({ key: key, value: value });
                            requestAdd.onsuccess = () => {
                                resolve(requestAdd.result);
                            };
                            requestAdd.onerror = event => {
                                console.error(event);
                                reject(event);
                            };
                        }
                    };
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     * @description
     * Add an item to the database
     *
     * @param {string | number} key
     * @param {StructuredCloneData} value
     * @returns {Promise<IDBValidKey | IDBRequest["result"]>}
     */
    @Ready
    add(key: IDBValidKey, value: string | number | boolean | object | Array<any>) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const objectStore = this.db.transaction([this.options.table], "readwrite").objectStore(this.options.table);
                    const request: IDBRequest = objectStore.get(key);
                    request.onerror = event => {
                        reject(event);
                    };
                    request.onsuccess = () => {
                        const data = request.result;
                        if (data?.value) {
                            resolve(data.value);
                        }
                        else {
                            const requestAdd = objectStore.add({ key: key, value: value });
                            requestAdd.onsuccess = () => {
                                resolve(requestAdd.result);
                            };
                            requestAdd.onerror = event => {
                                reject(event);
                            };
                        }
                    };
                }
                else {
                    reject(new Error('db is not defined'));
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     * @description
     * Get an item from the database
     *
     * @param {string | number} key
     * @returns
     */
    @Ready
    getItem(key: IDBValidKey): Promise<IDBRequest["result"] | null> {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table]);
                    const objectStore = transaction.objectStore(this.options.table);
                    const request: IDBRequest = objectStore.get(key);
                    request.onerror = event => {
                        reject(event);
                    };
                    request.onsuccess = () => {
                        const data = request.result;
                        if (data?.value) {
                            resolve(data.value);
                        }
                        else {
                            resolve(null);
                        }
                    };
                }
                else {
                    reject(new Error('db is not defined'));
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     *@description
     * Get all items from the database
     *
     * @returns {Promise<Array<any> | null>}
     */
    @Ready
    getAll(): Promise<any[]> {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table]);
                    const objectStore = transaction.objectStore(this.options.table);
                    const request: IDBRequest = objectStore.getAll();
                    request.onerror = event => {
                        reject(event);
                    };
                    request.onsuccess = () => {
                        const data = request.result;
                        if (data) {
                            resolve(data);
                        }
                        else {
                            resolve([]);
                        }
                    };
                }
                else {
                    reject(new Error('db is not defined "getAll()"'));
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    /**
     * @description
     * Remove an item from the database
     *
     * @param {string | number} key
     * @returns {Promise<boolean>}
     */
    @Ready
    removeItem(key: IDBValidKey): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            console.log(this.IndexedKVReadyFlag)
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const request = this.db.transaction([this.options.table], "readwrite")
                        .objectStore(this.options.table)
                        .delete(key);
                    request.onsuccess = () => {
                        resolve(true);
                    };
                    request.onerror = event => {
                        console.error(event);
                        reject(false);
                    };
                }
                else {
                    console.error('db is not defined "removeItem()"');
                    reject(false);
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}

export default IndexedKV;
