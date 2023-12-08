import { makeAutoObservable, onBecomeUnobserved, configure, toJS, autorun } from "mobx";
import * as __ from "lib384/dist/384.esm.js";
import ChannelStore from "./Channel.Store";
import IndexedKV from "../utils/IndexedKV";


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

export interface SnackabraStoreType {
  readyResolver: (value: unknown) => void;
  config: __.SnackabraTypes.SBServer;
  SB: __.Snackabra;
  ready: Promise<unknown>;
  channels: { [key: string]: ({ id: string, alias?: string, key?: JsonWebKey, readyResolver?: any } | ChannelStore) };
  contacts: { [key: string]: string };
  join: (channelId: string, key?: JsonWebKey) => Promise<ChannelStore>;
  create: (secret: any, alias: any) => Promise<ChannelStore>;
  importKeys: (importedData: { roomData: { [x: string]: any; }; roomMetadata: { [x: string]: any; }; contacts: any; }) => Promise<boolean>;
  createContact: (alias: any, keyOrPubIdentifier: string | JsonWebKey) => string;
  getContact: (keyOrPubIdentifier: string | JsonWebKey) => { _id: string; name: string; };
}
export class SnackabraStore implements SnackabraStoreType {

  readyResolver!: (value: unknown) => void;
  config: __.SnackabraTypes.SBServer = {
    channel_server: "",
    channel_ws: "",
    storage_server: ""
  };
  private _channels: { [key: string]: ({ id: string, alias?: string, key?: JsonWebKey, readyResolver?: any } | ChannelStore) } = {};
  private _contacts: { [key: string]: string } = {};
  SB: __.Snackabra;
  ready = new Promise((resolve) => {
    this.readyResolver = resolve
  })

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

  private migrate = async (v: any) => {
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

  mergeContacts = (contacts: any) => {
    this.contacts = Object.assign(this.contacts, contacts)
  }

  getContacts = async () => {
    let contacts = await cacheDb.getItem('sb_data_contacts') || {};
    this.contacts = Object.assign(this.contacts, contacts);
  }

  getContact = (keyOrPubIdentifier: string | JsonWebKey) => {
    if (typeof keyOrPubIdentifier === 'string') {
      const name = typeof this.contacts[keyOrPubIdentifier] !== 'undefined' ? this.contacts[keyOrPubIdentifier] : 'Unamed';
      return { _id: keyOrPubIdentifier, name: name }
    } else {
      const key = keyOrPubIdentifier;
      const name = typeof this.contacts[key?.x + ' ' + key?.y] !== 'undefined' ? this.contacts[key?.x + ' ' + key?.y] : 'Unamed';
      return { _id: key.x + ' ' + key.y, name: name }
    }

  }

  createContact = (alias: any, keyOrPubIdentifier: string | JsonWebKey) => {
    if (!keyOrPubIdentifier || !alias) {
      throw new Error('createContact requires a key and alias')
    }

    if (typeof keyOrPubIdentifier === 'string') {
      this._contacts[keyOrPubIdentifier] = alias
      this.save()
      return this._contacts[keyOrPubIdentifier]
    }
    const key = keyOrPubIdentifier;
    this._contacts[key.x + ' ' + key.y] = alias
    this.save()
    return this._contacts[key.x + ' ' + key.y]
  }

  get channels() {
    return this._channels
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

  join = (channelId: string, key?: JsonWebKey): Promise<ChannelStore> => {
    return new Promise(async (resolve, reject) => {
      try {
        let channelStore = new ChannelStore(this.config, channelId);
        let channel = await channelStore.connect(console.log)
        if (channel instanceof ChannelStore) {
          if (key) {
            channel.key = key
          }
          this._channels[channel.id] = channel;
          await this.save();
          resolve(channel);
        } else {
          throw new Error('Channel not created')
        }
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }


  create = (secret: any, alias: any): Promise<ChannelStore> => {
    return new Promise(async (resolve, reject) => {
      try {
        const channel = new ChannelStore(this.config);
        await channel.create(secret);
        this.channels[channel.id] = channel;
        this.channels[channel.id].alias = alias;
        this.save();
        resolve(this.channels[channel.id] as ChannelStore);
      } catch (e) {
        console.error(e)
        reject(e)
      }
    });
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