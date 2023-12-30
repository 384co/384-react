import { makeAutoObservable, onBecomeUnobserved, onBecomeObserved, toJS, computed, action } from "mobx";
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
// export type ChannelStoreTypeAlias = ChannelStoreType;
export class ChannelStore {
    constructor(config, channelId) {
        this._status = 'CLOSED';
        this._messages = [];
        this._ready = false;
        this._owner = false;
        this._capacity = 20;
        this._motd = '';
        this._visible = true;
        this.ChannelStoreReadyFlag = new Promise((resolve) => {
            this._ready = true;
            this.readyResolver = resolve;
        });
        this.lastSeenMessage = 0;
        this.getChannel = (channel) => {
            return new Promise((resolve) => {
                cacheDb.getItem('sb_data_' + channel).then(async (data) => {
                    if (data) {
                        this.id = data.id;
                        this.alias = data.alias;
                        this.key = data.key;
                        this.keys = data.keys;
                        this.messages = data.messages;
                        this.lastSeenMessage = data.lastSeenMessage;
                        this.motd = data.motd;
                        this.capacity = data.capacity;
                        // this.getChannelMessages()
                        resolve(data);
                    }
                    else {
                        resolve(false);
                    }
                });
            });
        };
        this.makeVisible = () => {
            this.connect().then((result) => {
                if (result) {
                    this._visible = true;
                    if (this._socket)
                        this.status = this._socket.status;
                    this.getOldMessages(0);
                }
            });
        };
        this.save = async () => {
            await this.ChannelStoreReadyFlag;
            if (this._savingTimout) {
                window.clearTimeout(this._savingTimout);
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
                        };
                        console.warn('saving channel state', save);
                        await cacheDb.setItem('sb_data_' + this.id, save);
                    }
                }
                catch (e) {
                    if (e instanceof Error)
                        console.warn('There was an issue saving the channel state.', e.message);
                }
            }, 250);
        };
        this.getChannelMessages = async () => {
            this.workerPort.port2.postMessage({ method: 'getMessages', channel_id: this._id });
        };
        this.getMessages = () => {
            return toJS(this._messages);
        };
        this.getStorageAmount = () => {
            return this._socket?.api.getStorageLimit();
        };
        this.getOldMessages = (length) => {
            return new Promise((resolve, reject) => {
                if (!this._socket)
                    throw new Error("no socket");
                try {
                    this._socket.api.getOldMessages(length).then((r_messages) => {
                        console.log("==== got these old messages:");
                        // this.messages = r_messages
                        for (let x in r_messages) {
                            let m = r_messages[x];
                            this.receiveMessage(m);
                        }
                        this.save();
                        this.getChannelMessages();
                        resolve(r_messages);
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        };
        this.replyEncryptionKey = async (recipientPubkey) => {
            if (!this._socket)
                throw new Error("no socket");
            if (!this._socket.keys.privateKey)
                throw new Error("no private key, this shouldn't happen!");
            return Crypto.deriveKey(this._socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
        };
        this.sendMessage = (body, message) => {
            if (!this._socket)
                throw new Error("no socket");
            const SBM = new SB.SBMessage(this._socket, message ? message : '');
            SBM.contents = body;
            return this._socket.send(SBM);
        };
        // This isnt in the the jslib atm
        // PSM: it is now but needs testing
        this.lock = () => {
            return new Promise((resolve, reject) => {
                if (!this._socket)
                    throw new Error("no socket");
                try {
                    this._socket.api.lock().then((locked) => {
                        console.log(locked);
                        resolve(locked);
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        };
        this.downloadData = async () => {
            try {
                if (!this._socket)
                    throw new Error("no socket");
                let data = await this._socket.api.downloadData();
                // @ts-ignore
                delete data.channel.SERVER_SECRET;
                data.storage.target = window.location.host;
                return data;
            }
            catch (e) {
                console.error(e);
                return false;
            }
        };
        // MTG: this will be changed inthe future to work with budding
        this.create = (secret) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const c = await this.SB.create(this.config, secret);
                    console.log("==== created channel:");
                    console.log(c);
                    this.id = c.channelId;
                    this.key = c.key;
                    resolve(this);
                }
                catch (e) {
                    console.error(e);
                    reject(e);
                }
            });
        };
        this.connect = async (messageCallback) => {
            this._messageCallback = messageCallback;
            if (this._socket && this._socket.status === 'OPEN') {
                console.log("==== already connected to channel:" + this.id);
                return true;
            }
            if (!this.id) {
                throw new Error("no channel id");
            }
            try {
                console.log(this);
                console.log("==== connecting to channel:" + this.id);
                console.log("==== with key:" + this.key);
                const c = await this.SB.connect(m => { this.receiveMessage(m, true); }, this.key, this.id);
                console.log("==== connected to channel:");
                console.log(c);
                if (c) {
                    await c.channelSocketReady;
                    this.key = c.exportable_privateKey;
                    this.socket = c;
                    this.keys = c.keys;
                    this.owner = c.owner;
                    try {
                        const r = await c.api.getCapacity();
                        this.capacity = r.capacity;
                    }
                    catch (e) {
                        console.warn(e);
                    }
                    this.motd = c.motd || '';
                    this.getOldMessages(0);
                    this.readyResolver();
                    await this.save();
                    return this;
                }
                else {
                    return false;
                }
            }
            catch (e) {
                console.error(e);
                return false;
            }
        };
        this.receiveMessage = (m, updateState = false) => {
            console.log("==== received this message:", this._id, m);
            if (updateState) {
                this.messages = [...this._messages, m];
            }
            this.workerPort.port2.postMessage({ method: 'addMessage', channel_id: this._id, message: m, args: { updateState: updateState } });
        };
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
        makeAutoObservable(this, {
            id: computed,
            key: computed,
            alias: computed,
            socket: computed,
            capacity: computed,
            motd: computed,
            owner: computed,
            status: computed,
            messages: computed,
            getOldMessages: action,
            downloadData: action,
            replyEncryptionKey: action,
            lock: action,
            create: action,
            connect: action,
        });
        onBecomeUnobserved(this, "messages", () => {
            console.log('messages unobserved');
            this.save();
        });
        onBecomeObserved(this, "messages", () => {
            console.log('messages observed');
        });
        document.addEventListener('visibilitychange', (e) => {
            if (document.visibilityState === 'hidden') {
                this._visible = false;
                this.status = 'UNFOCUSED';
            }
            if (document.visibilityState === 'visible') {
                this._visible = true;
                if (this.socket) {
                    console.log('visbility change: setting status to', this.socket.status);
                    this.status = 'LOADING';
                    this.makeVisible();
                }
            }
        });
        window.addEventListener("offline", (e) => {
            console.log("browser has gone offline");
            this.status = 'CLOSED';
            console.log('settings stateus status to', this.status);
        });
        window.addEventListener("online", (e) => {
            console.log("browser is now online");
            this.makeVisible();
        });
        if (channelId) {
            this.id = channelId;
            this.getChannel(this.id);
        }
        this.workerPort = new MessageChannel();
        this.workerPort.port2.onmessageerror = (e) => {
            console.error('message error', e);
        };
        this.workerPort.port2.onmessage = (e) => {
            if (e.data.channel_id !== this._id) {
                console.log('message not for this channel', e.data, this._id);
                return;
            }
            console.log('message processed by worker', e.data.channel_id, this._id);
            switch (e.data.method) {
                case 'addMessage':
                    console.log('adding message', e);
                    if (e.data.args.updateState) {
                        this.messages = [...this._messages, e.data.data];
                    }
                    // this.messages = [...this._messages, e.data.data]
                    break;
                case 'getMessages':
                    console.log(e);
                    if (e.data.data.length !== this._messages.length) {
                        this.messages = e.data.data;
                    }
                    break;
                default:
                    console.warn('unknown worker message', e.data);
            }
        };
        this.workerPort.port2.onmessageerror = (e) => {
            console.error('message error', e);
        };
        messageWorker.postMessage({ port: this.workerPort.port1 }, [this.workerPort.port1]);
    }
    get id() {
        return toJS(this._id);
    }
    set id(id) {
        if (!id) {
            console.error('no id set for channel');
            return;
        }
        this._id = id;
        this.save();
    }
    get key() {
        return toJS(this._key);
    }
    set key(key) {
        if (!key) {
            console.warn('no key set for channel');
            return;
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
    get messages() {
        return this._messages;
    }
    set messages(messages) {
        this._messages = messages;
        this.save();
    }
    set alias(alias) {
        if (!alias) {
            // console.trace()
            return;
        }
        this._alias = alias;
        this.save();
    }
    get alias() {
        return this._alias;
    }
    get socket() {
        return this._socket;
    }
    set socket(socket) {
        if (!socket) {
            console.trace();
            return;
        }
        this._socket = socket;
        if (this._socket) {
            this.status = this._socket.status;
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
    }
    ;
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
        return this._owner;
    }
    set owner(owner) {
        this._owner = owner;
    }
}
export default ChannelStore;
