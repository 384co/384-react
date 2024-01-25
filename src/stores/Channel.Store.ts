import { makeAutoObservable, onBecomeUnobserved, onBecomeObserved, toJS, computed, runInAction } from "mobx";
import { orderBy } from 'lodash';
import IndexedKV from "../utils/IndexedKV";
import MessageWorker from "../workers/MessageWorker.js";
import * as __ from "lib384/dist/384.esm.js";
const blob = new Blob([`(${MessageWorker})()`]);
const messageWorker = new Worker(URL.createObjectURL(blob), { name: '384 Message Worker' });
let SB = __.NewSB;
let Crypto = new SB.SBCrypto();

let cacheDb = new IndexedKV({
    db: 'sb_data',
    table: 'cache'
});

export interface ChannelStoreType {
    id: any;
    key: any;
    alias: any;
    socket: __.SnackabraTypes.ChannelSocket;
    capacity: any;
    motd: any;
    owner: any;
    status: any;
    messages: __.SnackabraTypes.ChannelMessage[];
    getMessages: () => __.SnackabraTypes.ChannelMessage[];
    getOldMessages: (length: number | undefined) => Promise<unknown>;
    getStorageAmount: () => Promise<number | null>;
    replyEncryptionKey: (recipientPubkey: string) => Promise<unknown>;
    sendMessage: (body: { [key: string]: any }, message?: string) => Promise<unknown>;
    lock: () => Promise<unknown>;
    create: (secret: string) => Promise<unknown>;
    connect: (messageCallback?: ((...data: any[]) => void) | undefined) => Promise<unknown>;

}

// export type ChannelStoreTypeAlias = ChannelStoreType;

export class ChannelStore implements ChannelStoreType {
    private _id: any;
    private _alias: any;
    private _status = 'CLOSED'
    private _key: any;
    private _keys: any;
    private _socket?: __.SnackabraTypes.ChannelSocket;
    private _messages: __.SnackabraTypes.ChannelMessage[] = [];
    private _ready = false;
    private _owner = false;
    private _capacity = 20;
    private _motd = '';
    private _messageCallback?: CallableFunction;
    private _visible = true;
    private _savingTimout?: number;
    private _getOldMessagesMap: Map<string, any> = new Map();
    private _db;
    messages: __.ChannelMessage[] = [];
    workerPort: MessageChannel;
    readyResolver!: () => void;
    ChannelStoreReadyFlag = new Promise((resolve) => {
        this._ready = true;
        this.readyResolver = resolve as any;
    });
    getOldMessagesResolver!: () => void;
    getOldMessagesReadyFlag = new Promise((resolve) => {
        this.getOldMessagesResolver = resolve as any;
    });
    lastSeenMessage = 0;
    SB;
    config: __.SBServerTypeAlias;

    constructor(config: __.SBServerTypeAlias, channelId?: string) {
        this.config = config;
        // this.config.onClose = () => {
        //   console.log('onClose hook called')
        //   this.status = 'CLOSED'
        //   if (this._visible) {
        //     this.makeVisible()
        //   }
        // }

        // this.config.onOpen = () => {
        //   console.log('onOpen hook called')
        //   this.status = 'OPEN'
        // }
        // this.config.onError = (e: any) => {
        //   console.log('onError hook called')
        //   this.status = 'ERROR'
        //   console.error(e)
        //   if (this._visible) {
        //     console.log('reconnecting')
        //     this.makeVisible()
        //   }
        // }
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
                this._visible = false;
                this.status = 'UNFOCUSED'
            }

            if (document.visibilityState === 'visible') {
                this._visible = true;
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

        this.workerPort = new MessageChannel();
        this.workerPort.port2.onmessageerror = (e: any) => {
            console.error('message error', e)
        }

        this.workerPort.port2.onmessage = (e: MessageEvent) => {
            if (e.data.channel_id !== this._id) {
                console.log('message not for this channel', e.data, this._id)
                return
            }
            console.log('message processed by worker', e.data.channel_id, this._id)
            switch (e.data.method) {
                case 'addMessage':
                    if (e.data.args.updateState) {

                        this.messages.push(e.data.data)

                    }
                    break;
                case 'getMessages':
                    console.log('worker returns getting messages', e)
                    if (e.data.data.length !== this._messages.length) {
                        this.messages = e.data.data
                        this.getOldMessagesResolver()

                    }

                    break
                default:
                    console.warn('unknown worker message', e.data)
            }

        }
        this.workerPort.port2.onmessageerror = (e: any) => {
            console.error('message error', e)
        }
        messageWorker.postMessage({ port: this.workerPort.port1 }, [this.workerPort.port1]);
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
                    // this.getChannelMessages()
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
                this._visible = true;
                if (this._socket)
                    this.status = this._socket.status
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
        // this.workerPort.port2.postMessage({ method: 'getMessages', channel_id: this._id })
        const messages = await this._db.getAll()
        console.log('got messages from db', messages)
        const newMessages = []
        if (messages.length > 0) {
            for(let x in messages) {
                this._getOldMessagesMap.set(messages[x]._id, messages[x])
                newMessages.push(messages[x].value)
            }
        }

        console.log('new messages', newMessages.length)
        console.log('old messages', this.messages.length)
        if(newMessages.length > 0 && newMessages.length > this._messages.length) {
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
            this.status = this._socket.status
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

    getStorageAmount = async (): Promise<number | null> => {
        if (this._socket) {
            try {
                const amount = await this._socket!.api.getStorageLimit() as unknown as { storageLimit: number }
                console.log(amount)
                return amount.storageLimit
            } catch (e) {
                if (e instanceof Error)
                    console.warn(e.message)
                return null
            }

        } else {
            return null
        }

    }

    processOldMessages = async (messages: Array<__.SnackabraTypes.ChannelMessage>) => {
    }

    batchSet = async (messages: Array<{ key: string, value: any }>) => {
        if (!this._db) throw new Error("no db");
        this._db.batchSet(messages).then((result) => {
            this.getChannelMessages()
        })
    }

    getOldMessages = async (length: number = 0, size: number = 0): Promise<Map<string, any>> => {
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

    sendMessage = (body: { [key: string]: any }, message?: string) => {
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
            // @ts-ignore
            delete data.channel.SERVER_SECRET
            data.storage.target = window.location.host
            return data
        } catch (e) {
            console.error(e)
            return false
        }
    };

    // MTG: this will be changed inthe future to work with budding
    create = (secret: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                const c = await this.SB.create(this.config, secret);
                console.log("==== created channel:"); console.log(c);
                this.id = c.channelId
                this.key = c.key
                resolve(this);
            } catch (e) {
                console.error(e)
                reject(e)
            }
        })
    };

    connect = async (messageCallback?: ((...data: any[]) => void) | undefined) => {
        this._messageCallback = messageCallback;
        if (this._socket && this._socket.status === 'OPEN') {
            console.log("==== already connected to channel:" + this.id)
            return true
        }
        if (!this.id) {
            throw new Error("no channel id")
        }
        try {
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
                // alert('connected')
                // await this.getOldMessagesReadyFlag;
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
                return false
            }
        } catch (e) {
            console.error(e)
            return false
        }

    };

    receiveMessage = (m: __.ChannelMessage, updateState = false) => {
        if (!this._db) throw new Error("no db");
        if (updateState) {
            this.messages.push(m)
        }
        this._db.setItem(m._id as string, m)
        // this.workerPort.port2.postMessage({ method: 'addMessage', channel_id: this._id, message: m, args: { updateState: updateState } })
    };

}

export default ChannelStore;