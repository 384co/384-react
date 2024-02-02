import { makeAutoObservable, onBecomeUnobserved, onBecomeObserved, toJS, computed, runInAction } from "mobx";
import { orderBy } from 'lodash';
import IndexedKV from "../utils/IndexedKV.js";
import * as __ from "lib384/dist/384.esm.js";
let SB = __.NewSB;
let Crypto = new SB.SBCrypto();

let cacheDb = new IndexedKV({
    db: 'sb_data',
    table: 'cache'
});

export interface ChannelStoreType {
    id: string;
    key: JsonWebKey;
    alias: string;
    socket: __.SnackabraTypes.ChannelSocket;
    capacity: number;
    motd: string;
    owner: boolean;
    status: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR' | 'UNFOCUSED' | 'LOADING';
    ChannelStoreReadyFlag: Promise<void>;
    messages: __.SnackabraTypes.ChannelMessage[];
    getMessages: () => __.SnackabraTypes.ChannelMessage[];
    getOldMessages: (length?: number) => Promise<unknown>;
    getStorageAmount: () => Promise<number>;
    replyEncryptionKey: (recipientPubkey: string) => Promise<unknown>;
    sendMessage: (body: { [key: string]: any }, message?: string) => Promise<string>;
    lock: () => Promise<unknown>;
    connect: () => Promise<this>;

}

// export type ChannelStoreTypeAlias = ChannelStoreType;

export class ChannelStore implements ChannelStoreType {
    private _id: any;
    private _alias: any;
    private _status: ChannelStoreType['status'] = 'CLOSED'
    private _key: any;
    private _keys: any;
    private _socket?: __.SnackabraTypes.ChannelSocket;
    private _messages: __.SnackabraTypes.ChannelMessage[] = [];
    private _owner = false;
    private _capacity = 20;
    private _motd = '';
    private _savingTimout?: number;
    private _getOldMessagesMap: Map<string, any> = new Map();
    private _db;
    messages: __.ChannelMessage[] = [];
    readyResolver!: () => void;
    ChannelStoreReadyFlag = new Promise<void>((resolve) => {
        this.readyResolver = resolve;
    });
    getOldMessagesResolver!: () => void;
    getOldMessagesReadyFlag = new Promise<void>((resolve) => {
        this.getOldMessagesResolver = resolve;
    });
    lastSeenMessage = 0;
    SB;
    config: __.SBServerTypeAlias;

    constructor(config: __.SBServerTypeAlias, channelId?: string) {
        this.config = config;
        this.SB = new SB.Snackabra(this.config);

        makeAutoObservable(this);

        onBecomeUnobserved(this, "messages", () => {
            console.log('messages unobserved')
            this.save()
        });

        onBecomeObserved(this, "messages", () => {
            console.log('messages observed')
        });

        document.addEventListener('visibilitychange', (e) => {
            if (document.visibilityState === 'hidden') {
                this.status = 'UNFOCUSED'
            }

            if (document.visibilityState === 'visible') {
                if (this.socket) {
                    console.log('visbility change: setting status to', this.socket.status)
                    this.status = 'LOADING'
                    this.makeVisible()
                }
            }
        });

        window.addEventListener("offline", (e) => {
            console.log("browser has gone offline");
            this.status = 'CLOSED'
            console.log('settings stateus status to', this.status)
        });

        window.addEventListener("online", (e) => {
            console.log("browser is now online");
            this.makeVisible()
        });

        if (channelId) {
            this.id = channelId;
            this.getChannel(this.id);
            this._db = new IndexedKV({
                db: this.id,
                table: 'messages'
            });
        }
    }

    private getChannel = (channel: string) => {
        return new Promise((resolve) => {
            cacheDb.getItem('sb_data_' + channel).then(async (data) => {
                if (data) {
                    this.id = data.id;
                    this.alias = data.alias;
                    this.key = data.key;
                    this.keys = data.keys;
                    this.messages = data.messages || [];
                    this.lastSeenMessage = data.lastSeenMessage;
                    this.motd = data.motd;
                    this.capacity = data.capacity;
                    resolve(data)
                } else {
                    resolve(false)
                }
            })
        })
    }

    private makeVisible = () => {
        this.connect().then((result) => {
            if (result) {
                if (this._socket)
                    this.status = this._socket.status as ChannelStoreType['status']
                this.getOldMessages(100)
            }
        })

    }
    private save = async () => {
        await this.ChannelStoreReadyFlag
        if (this._savingTimout) {
            window.clearTimeout(this._savingTimout)
        }
        this._savingTimout = window.setTimeout(async () => {
            try {
                if (this.id) {
                    const save = {
                        id: toJS(this._id),
                        alias: toJS(this._alias),
                        messages: orderBy(toJS(this._messages), ['createdAt'], ['asc']),
                        owner: toJS(this._owner),
                        key: toJS(this._key),
                        keys: toJS(this._keys),
                        motd: toJS(this._motd),
                        capacity: toJS(this._capacity),
                        lastSeenMessage: toJS(this.lastSeenMessage)
                    }
                    console.warn('saving channel state', save)
                    await cacheDb.setItem('sb_data_' + this.id, save)
                }
            } catch (e) {
                if (e instanceof Error)
                    console.warn('There was an issue saving the channel state.', e.message)
            }
        }, 250)

    }

    getChannelMessages = async () => {
        console.log(this._id)
        if (this._db === undefined) {
            console.log('db is undefined')
            return false;
        }
        const messages = await this._db.getAll()
        console.log('got messages from db', messages)
        const newMessages = []
        if (messages.length > 0) {
            for (let x in messages) {
                this._getOldMessagesMap.set(messages[x]._id, messages[x])
                newMessages.push(messages[x].value)
            }
        }

        console.log('new messages', newMessages.length)
        console.log('old messages', this.messages.length)
        if (newMessages.length > 0 && newMessages.length > this._messages.length) {
            this.messages = newMessages
        }

        return true;
    }

    get id() {
        return toJS(this._id);
    }

    set id(id) {
        if (!id) {
            console.error('no id set for channel')
            return
        }
        this._id = id;
        this.save();
    }

    get key() {
        return toJS(this._key);
    }

    set key(key) {
        if (!key) {
            console.warn('no key set for channel')
            return
        }
        this._key = key;
        this.save();
    }

    get keys() {
        return this._keys;
    }

    set keys(keys) {
        this._keys = keys;
        this.save();
    }

    getMessages = () => {
        return toJS(this._messages)
    }

    set alias(alias) {
        if (!alias) {
            // console.trace()
            return
        }
        this._alias = alias;
        this.save();
    }

    get alias() {
        return this._alias;
    }

    get socket() {
        return this._socket as any;
    }

    set socket(socket) {
        if (!socket) {
            alert('no socket')
            console.trace()
            return
        }
        this._socket = socket;
        if (this._socket) {
            this.status = this._socket.status as ChannelStoreType['status']
            this.save();
        }
    }

    get capacity() {
        return this._capacity;
    }

    set capacity(capacity) {
        this._capacity = capacity;
        if (this.owner && this._socket) {
            this._socket.api.updateCapacity(capacity);
        }
        this.save();
    };

    get motd() {
        return this._motd;
    }

    set motd(motd) {
        if (this.owner && this._socket) {
            this._socket.api.setMOTD(motd);
        }
        this._motd = motd;
        this.save();
    }

    get status() {
        return this._status;
    }

    set status(status) {
        this._status = status;
    }

    get owner() {
        return this._owner
    }

    set owner(owner) {
        this._owner = owner
    }

    getStorageAmount = async (): Promise<number> => {
        if (!this._socket) throw new Error("no socket");
        const amount = await this._socket.api.getStorageLimit() as unknown as { storageLimit: number }
        return amount.storageLimit
    }

    processOldMessages = async (messages: Array<__.SnackabraTypes.ChannelMessage>) => {
    }

    batchSet = async (messages: Array<{ key: string, value: any }>) => {
        if (!this._db) throw new Error("no db");
        this._db.batchSet(messages).then((result) => {
            this.getChannelMessages()
        })
    }

    getOldMessages = async (length: number = 0, size: number = 0): Promise<Map<string, __.ChannelMessage>> => {
        if (!this._socket) throw new Error("no socket");
        if (!this._db) throw new Error("no db");


        const r_messages: Array<__.SnackabraTypes.ChannelMessage> = await this._socket.api.getOldMessages(length, true);

        console.log("==== got these old messages:", r_messages.length);
        let newMessages: any = [];
        for (let x in r_messages) {
            let m = r_messages[x];
            if (m && !this._getOldMessagesMap.has(m._id as string)) {
                this._getOldMessagesMap.set(m._id as string, m);
                newMessages.push({
                    key: m._id,
                    value: m
                })
            }
        }
        if (newMessages.length > 0) {
            this.batchSet(newMessages);
        }
        console.log(this._id)
        console.log("==== got these old messages:", r_messages.length, size)
        if (this._getOldMessagesMap.size !== size) {
            console.log("==== getting more messages", this._getOldMessagesMap.size, r_messages.length + size)
            return await this.getOldMessages(length, this._getOldMessagesMap.size);
        }

        return this._getOldMessagesMap;

    };

    replyEncryptionKey = async (recipientPubkey: string) => {
        if (!this._socket) throw new Error("no socket")
        if (!this._socket.keys.privateKey) throw new Error("no private key, this shouldn't happen!")
        return Crypto.deriveKey(this._socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"])
    }

    sendMessage = (body: { [key: string]: any }, message?: string): Promise<string> => {
        if (!this._socket) throw new Error("no socket")
        const SBM = new SB.SBMessage(this._socket, message ? message : '') as any
        SBM.contents = body
        return this._socket.send(SBM);
    }

    // This isnt in the the jslib atm
    // PSM: it is now but needs testing
    lock = () => {
        return new Promise((resolve, reject) => {
            if (!this._socket) throw new Error("no socket")
            try {
                this._socket.api.lock().then((locked: any) => {
                    console.log(locked)
                    resolve(locked)
                })
            } catch (e) {
                reject(e)
            }
        })
    };

    downloadData = async () => {
        try {
            if (!this._socket) throw new Error("no socket")

            let data = await this._socket.api.downloadData() as { storage: { target: string } }
            // @ts-ignore keeping for old stuffs
            delete data.channel.SERVER_SECRET
            data.storage.target = window.location.host
            return data
        } catch (e) {
            console.error(e)
            return false
        }
    };

    connect = async () => {
        if (this._socket && this._socket.status === 'OPEN') {
            console.log("==== already connected to channel:" + this.id)
            return this
        }
        if (!this.id) {
            throw new Error("no channel id")
        }

        console.log(this)
        console.log("==== connecting to channel:", this.id)
        console.log("==== with key:", this.key)
        const c = await this.SB.connect(
            m => { this.receiveMessage(m, true); },
            this.key,
            this.id
        );
        console.log("==== connected to channel:"); console.log(c);
        if (c) {
            await c.channelSocketReady;
            await this.getChannelMessages();
            this.key = c.exportable_privateKey
            this._socket = c;
            this.keys = c.keys;
            this.owner = c.owner
            try {
                const r = await c.api.getCapacity();
                this.capacity = r.capacity;
            } catch (e) {
                console.warn(e)
            }

            this.motd = c.motd || '';
            this.getOldMessages(100);
            this.readyResolver();
            await this.save();
            return this
        } else {
            throw new Error("no channel socket")
        }


    };

    receiveMessage = (m: __.ChannelMessage, updateState = false) => {
        if (!this._db) throw new Error("no db");
        if (updateState) {
            console.warn('adding message to state', m)
            this.messages.push(m)
        }
        this._db.setItem(m._id as string, m)
    };

}

export default ChannelStore;