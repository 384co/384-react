import { ChannelStore } from "../ChannelStore/Channel.Store.d"
import {SnackabraStore} from "./Snackabra.Store"
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

export type Channels = { [key: string]: (SerializedChannel | ChannelStore) }
export type KeyOrPubIdentifier = PubIdentifier | JsonWebKey

export type PubIdentifier = `${JsonWebKey['x']} ${JsonWebKey['y']}`

export interface SBStore extends SnackabraStore {}