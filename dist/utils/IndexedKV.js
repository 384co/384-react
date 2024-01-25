class IndexedKV {
    constructor(options) {
        this.openDatabaseIterations = 0;
        this.IndexedKVReadyFlag = new Promise((resolve) => {
            this.readyResolver = resolve;
        });
        this.options = {
            db: 'MyDB',
            table: 'default'
        };
        this.openDataBase = (version = undefined) => {
            this.openDatabaseIterations++;
            console.log(`Opening database ${this.options.db}... version ${version ? version : 0}`);
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
                }
                else {
                    if (this.openDatabaseIterations > 1) {
                        throw new Error(`Object store '${this.options.table}' does not exist in the database. Aborting...`);
                    }
                    else {
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
        };
        this.options = Object.assign(this.options, options);
        if (!globalThis.indexedDB) {
            throw new Error("Your browser doesn't support a stable version of IndexedDB.");
        }
        this.openDataBase();
    }
    /**
     * Similar to "Select * WHERE $regex" implementation
     * Matches the key against the regex and returns the value
     *
     * @param regex {Regular expression matcher}
     * @param {Function=} callback
     * @returns {Promise<Array<IDBRequest["result"]>>}
     */
    openCursor(regex, callback) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table], "readonly");
                    const objectStore = transaction.objectStore(this.options.table);
                    const request = objectStore.openCursor(null, 'next');
                    let returnArray = [];
                    request.onsuccess = function () {
                        const cursor = request.result;
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
            }
            catch (e) {
                reject(e);
            }
        });
    }
    batchSet(items) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table], "readwrite");
                    const objectStore = transaction.objectStore(this.options.table);
                    items.forEach(item => {
                        objectStore.put(item);
                    });
                    transaction.oncomplete = () => {
                        console.warn('Batch set complete');
                        resolve(true);
                    };
                    transaction.onerror = event => {
                        console.error(event);
                        reject(event);
                    };
                }
                else {
                    reject(new Error('db is not defined'));
                }
            }
            catch (e) {
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
    setItem(key, value) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const objectStore = this.db.transaction([this.options.table], "readwrite").objectStore(this.options.table);
                    const request = objectStore.get(key);
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
                            }
                            catch (e) {
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
            }
            catch (e) {
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
    add(key, value) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const objectStore = this.db.transaction([this.options.table], "readwrite").objectStore(this.options.table);
                    const request = objectStore.get(key);
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
            }
            catch (e) {
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
    getItem(key) {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table]);
                    const objectStore = transaction.objectStore(this.options.table);
                    const request = objectStore.get(key);
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
            }
            catch (e) {
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
    getAll() {
        return new Promise(async (resolve, reject) => {
            await this.IndexedKVReadyFlag;
            try {
                if (this.db) {
                    const transaction = this.db.transaction([this.options.table]);
                    const objectStore = transaction.objectStore(this.options.table);
                    const request = objectStore.getAll();
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
            }
            catch (e) {
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
    removeItem(key) {
        return new Promise(async (resolve, reject) => {
            console.log(this.IndexedKVReadyFlag);
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
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
export default IndexedKV;
