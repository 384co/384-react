import * as __ from "lib384/dist/384.esm.js";
export declare class ChannelStore {
    private _id;
    private _alias;
    private _status;
    private _key;
    private _keys;
    private _socket?;
    private _messages;
    private _owner;
    private _capacity;
    private _motd;
    private _savingTimout?;
    private _getOldMessagesMap;
    private _db;
    messages: __.ChannelMessage[];
    readyResolver: () => void;
    ChannelStoreReadyFlag: Promise<void>;
    getOldMessagesResolver: () => void;
    getOldMessagesReadyFlag: Promise<void>;
    lastSeenMessage: number;
    SB: __.Snackabra;
    config: __.SBServerTypeAlias;
    constructor(config: __.SBServerTypeAlias, channelId?: string);
    private getChannel;
    private makeVisible;
    private save;
    getChannelMessages: () => Promise<boolean>;
    get id(): any;
    set id(id: any);
    get key(): any;
    set key(key: any);
    get keys(): any;
    set keys(keys: any);
    getMessages: () => __.ChannelMessage[];
    set alias(alias: any);
    get alias(): any;
    get socket(): any;
    set socket(socket: any);
    get capacity(): number;
    set capacity(capacity: number);
    get motd(): string;
    set motd(motd: string);
    get status(): "CLOSED" | "CONNECTING" | "OPEN" | "CLOSING" | "UNFOCUSED" | "LOADING";
    set status(status: "CLOSED" | "CONNECTING" | "OPEN" | "CLOSING" | "UNFOCUSED" | "LOADING");
    get owner(): boolean;
    set owner(owner: boolean);
    getStorageAmount: () => Promise<number>;
    batchSet: (messages: Array<{
        key: string;
        value: any;
    }>) => Promise<void>;
    getOldMessages: (length?: number, size?: number) => Promise<Map<string, __.ChannelMessage>>;
    replyEncryptionKey: (recipientPubkey: string) => Promise<CryptoKey>;
    sendMessage: (body: {
        [key: string]: any;
    }, message?: string) => Promise<string>;
    lock: () => Promise<unknown>;
    downloadData: () => Promise<{
        storage: {
            target: string;
        };
    } | null>;
    connect: () => Promise<this>;
    receiveMessage: (m: __.ChannelMessage, updateState?: boolean) => void;
}
export default ChannelStore;
