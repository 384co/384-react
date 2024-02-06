import * as __ from "lib384/dist/384.esm.js";
import ChannelStore from "../ChannelStore/Channel.Store";
import { Contacts, Contact, KeyOrPubIdentifier } from "./Snackabra.Store.d";
export declare class SnackabraStore {
    readyResolver: () => void;
    config: __.SnackabraTypes.SBServer;
    private _channels;
    private _contacts;
    SB: __.Snackabra;
    ready: Promise<void>;
    constructor(sbConfig: __.SnackabraTypes.SBServer);
    private save;
    private getChannelsCache;
    private migrate;
    private finalizeMigration;
    private migrateChannel;
    /**
     * Checks if a channel exists in the client
     *
     * @param channelId
     * @returns boolean
     */
    hasChannel: (channelId: string) => boolean;
    /**
     * Returns a channel by id
     *
     * @param channelId
     * @returns ChannelStoreType
     */
    getChannel: (channelId: string) => ChannelStore;
    /**
     *
     * @param contacts
     * @returns void
     */
    private mergeContacts;
    getContacts: () => Promise<void>;
    getContact: (keyOrPubIdentifier: KeyOrPubIdentifier) => Contact;
    createContact: (contact: Contact, keyOrPubIdentifier: KeyOrPubIdentifier) => Contact;
    get channels(): {
        [key: string]: ChannelStore;
    };
    set channels(channels: {
        [key: string]: ChannelStore;
    });
    set contacts(contacts: Contacts);
    get contacts(): Contacts;
    joinChannel: (channelId: string, key?: JsonWebKey) => Promise<ChannelStore>;
    importKeys: (importedData: {
        roomData: {
            [x: string]: any;
        };
        roomMetadata: {
            [x: string]: any;
        };
        contacts: any;
    }) => Promise<boolean>;
}
export default SnackabraStore;
