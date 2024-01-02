import { stores } from "./stores/index";
import SnackabraStore from "stores/Snackabra.Store";
import ChannelStore from "stores/Channel.Store";
const version = process.env.VERSION
console.log(`=========== mobx-snackabra-store v${version} loading ===========`)
export type Stores = {
    snackabraStore: SnackabraStore;
    channelStore: ChannelStore;
};

export { stores };

