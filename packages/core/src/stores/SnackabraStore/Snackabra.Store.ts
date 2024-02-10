import { makeAutoObservable, onBecomeUnobserved, configure, toJS, autorun } from "mobx";
import * as __ from "lib384/dist/384.esm.js";
import { ChannelStore } from "../ChannelStore/Channel.Store";
import IndexedKV from "../../utils/IndexedKV";

export * from '../ChannelStore/Channel.Store'
export type Contacts = { [key: `${JsonWebKey['x']} ${JsonWebKey['y']}`]: Contact }

export type Contact = {
  _id: string;
  name: string;
  key?: JsonWebKey;
  alias?: string;
}

export type SerializedChannel = {
  id: string;
  alias?: string;
  key?: JsonWebKey;
  readyResolver?: any;
}

export type Channel = (SerializedChannel | ChannelStore)
export type Channels = { [key: string]: (SerializedChannel | ChannelStore) }
export type KeyOrPubIdentifier = PubIdentifier | JsonWebKey

export type PubIdentifier = `${JsonWebKey['x']} ${JsonWebKey['y']}`

export interface SBStore extends SnackabraStore { }


console.log("=========== mobx-snackabra-store loading ===========")

let SB = __.NewSB;
let cacheDb: IndexedKV;

configure({
  useProxies: "always",
  enforceActions: "observed",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: false
});

export class SnackabraStore {

  readyResolver!: () => void;
  config: __.SnackabraTypes.SBServer = {
    channel_server: "",
    channel_ws: "",
    storage_server: ""
  };
  private _channels: Channels = {};
  private _contacts: Contacts = {};
  SB: __.Snackabra;
  ready = new Promise<void>((resolve) => {
    this.readyResolver = resolve;
  });

  constructor(sbConfig: __.SnackabraTypes.SBServer) {
    if (!sbConfig) {
      throw new Error("SnackabraStore requires a config object")
    }
    this.config = sbConfig
    this.SB = new SB.Snackabra(this.config);

    makeAutoObservable(this);

    onBecomeUnobserved(this, "channels", this.save);
    cacheDb = new IndexedKV({
      db: 'sb_data',
      table: 'cache'
    });

    cacheDb.getItem('sb_data_migrated').then((migrated: { version: any; }) => {
      this.migrate(migrated?.version || 1)
    })

    autorun(() => {
      if (Object.keys(this._contacts).length > 0) {
        cacheDb.setItem('sb_data_contacts', toJS(this._contacts))
      }
    })
  }

  private save = async () => {
    try {
      let channels = {} as typeof this._channels
      for (let x in this.channels) {
        console.log(x, this.channels[x])
        if (x) {
          channels[x] = { id: x }
        }
      }
      await cacheDb.setItem('sb_data_channels', channels)
      return true;
    } catch (e: unknown) {
      if (e instanceof Error)
        console.warn('There was an issue saving the snackabra state.', e.message)
      return false;
    }

  }

  private getChannelsCache = async () => {
    let channels = await cacheDb.getItem('sb_data_channels');
    console.log(channels)
    if (channels && Object.keys(channels).length > 0) {
      this.channels = channels;
    } else {
      let _channels = await cacheDb.openCursor(/^sb_data_[A-Za-z0-9]{64}$/) as Array<{ value: { id: string } }>
      console.log(_channels)
      channels = {} as typeof this._channels
      for (let x in _channels) {
        if (channels[_channels[x].value!.id]) {
          channels[_channels[x].value!.id] = _channels[x].value
        }

      }
      this.channels = channels;
    }
    return channels;
  }

  private migrate = async (v: 1 | 2 | 3) => {
    const sb_data = JSON.parse(await cacheDb.getItem('sb_data'));
    let channels = await this.getChannelsCache();
    switch (v) {
      case 1:
        if (sb_data) {
          Object.keys(sb_data.rooms).forEach((roomId) => {
            for (let x in sb_data.rooms[roomId]) {
              // @ts-ignore
              this.channels[roomId][x] = sb_data.rooms[roomId][x];
            }
            cacheDb.setItem('sb_data_' + roomId, toJS(this.channels[roomId])).then(() => {
              delete this.channels[roomId];
            })
          })
        }
        this.migrate(2)
        return;
      case 2:
        if (channels) {
          this.channels = channels
        }
        this.migrate(3)
        return;
      case 3:
        console.log('Migrating to version 3')
        this.getContacts();
        let migrationPromises = [];
        for (let x in channels) {
          if (channels[x]) {
            migrationPromises.push(this.migrateChannel(channels[x].id))
          }
        }
        this.finalizeMigration(migrationPromises)
        break;
      default:
        throw new Error(`Unknown snackabra store migration version ${v}`)
    }
  }

  private finalizeMigration = (migrationPromise: Promise<void>[] = []) => {
    Promise.allSettled(migrationPromise).then(() => {
      cacheDb.setItem('sb_data_migrated', {
        timestamp: Date.now(),
        version: 3
      }).then(() => {
        // @ts-ignore
        this.readyResolver()
      })
    })
  }

  private migrateChannel = async (channelId: string) => {
    cacheDb.getItem('sb_data_' + channelId).then((channel: { contacts: any; id: any; _id: any; name: any; alias: any; key: any; }) => {
      if (channel) {
        console.warn('Migrating channel', channel)
        this.mergeContacts(channel.contacts)
        const id = channel.id || channel._id;
        this._channels[channelId] = new ChannelStore(this.config, id)
        let alias = channel.name || channel.alias
        this._channels[channelId].alias = alias
        this._channels[channelId].key = channel.key
      }
    })
  }

  /**
   * Checks if a channel exists in the client
   *
   * @param channelId
   * @returns boolean
   */
  hasChannel = (channelId: string) => {
    return typeof this.channels[channelId] !== 'undefined'
  }

  /**
   * Returns a channel by id
   *
   * @param channelId
   * @returns ChannelStoreType
   */
  getChannel = (channelId: string) => {
    if (!this.hasChannel(channelId)) throw new Error('Channel not found')
    return this.channels[channelId]
  }

  /**
   * 
   * @param contacts
   * @returns void
   */
  private mergeContacts = (contacts: any) => {
    this.contacts = Object.assign(this.contacts, contacts)
  }

  getContacts = async () => {
    let contacts = await cacheDb.getItem('sb_data_contacts') || {};
    this.contacts = Object.assign(this.contacts, contacts);
  }

  getContact = (keyOrPubIdentifier: KeyOrPubIdentifier): Contact => {
    try {
      if (typeof keyOrPubIdentifier === 'string') {
        const name = typeof this.contacts[keyOrPubIdentifier] !== 'undefined' ? this.contacts[keyOrPubIdentifier] : 'Unamed';
        return { _id: keyOrPubIdentifier, name: name } as Contact
      } else {
        const _id = keyOrPubIdentifier.x + ' ' + keyOrPubIdentifier.y as `${JsonWebKey['x']} ${JsonWebKey['y']}`
        const key = keyOrPubIdentifier;
        const contact = typeof this.contacts[_id] !== 'undefined' ? this.contacts[_id] : { name: 'Unamed', _id: _id, key: key };
        return contact

      }
    } catch (e) {
      console.error(e)
      return { name: 'Unamed', _id: 'Unkown' }
    }


  }

  createContact = (contact: Contact, keyOrPubIdentifier: KeyOrPubIdentifier): Contact => {
    if (!keyOrPubIdentifier || !contact) {
      throw new Error('createContact requires a key and alias')
    }

    if (typeof keyOrPubIdentifier === 'string') {
      const _id = keyOrPubIdentifier as `${JsonWebKey['x']} ${JsonWebKey['y']}`;
      this._contacts[_id] = contact
      this.save()
      return this._contacts[_id]
    }
    const _id = keyOrPubIdentifier.x + ' ' + keyOrPubIdentifier.y as `${JsonWebKey['x']} ${JsonWebKey['y']}`;
    this._contacts[_id] = contact
    this.save()
    return this._contacts[_id]
  }

  get channels() {
    return this._channels as { [key: string]: ChannelStore }
  }

  set channels(channels) {
    this._channels = channels
  }

  set contacts(contacts) {
    this._contacts = Object.assign(this._contacts, contacts)
  }
  get contacts() {
    return toJS(this._contacts)
  }

  joinChannel = (channelId: string, key?: JsonWebKey): Promise<ChannelStore> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (this._channels[channelId] && this._channels[channelId] instanceof ChannelStore && this._channels[channelId].key.x === key.x) {
          let channelStore = this._channels[channelId] as ChannelStore;
          resolve(await channelStore.connect());
        } else {
          let channelStore = new ChannelStore(this.config, channelId);
          if (key) {
            channelStore.key = key
          }
          let channel = await channelStore.connect()
          if (channel instanceof ChannelStore) {
            this._channels[channel.id] = channel;
            await this.save();
            resolve(channel);
          } else {
            throw new Error('Channel not created')
          }
        }
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }

  importKeys = (importedData: { roomData: { [x: string]: any; }; roomMetadata: { [x: string]: any; }; contacts: any; }): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('importing keys')
        console.log(importedData)
        for (let id in importedData.roomData) {
          console.log(id)
          const importedChannel = importedData.roomData[id]
          console.log(importedChannel)
          const metaData = importedData.roomMetadata[id]
          console.log(metaData)
          let knownRoom = this._channels[id];
          console.log(knownRoom)
          if (!knownRoom) {
            this._channels[id] = new ChannelStore(this.config, id)
          }
          this._channels[id].readyResolver()
          this._channels[id].alias = metaData.alias ? metaData.alias : metaData.name || `Room ${Object.keys(this._channels).length}`
          this._channels[id].key = importedChannel.key

        }
        this.contacts = Object.assign(this.contacts, importedData.contacts)
        this.save()
        resolve(true)
      } catch (e) {
        console.error(e)
        reject(e)
      }

    })

  };
}

export default SnackabraStore;