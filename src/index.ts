import { stores } from "./stores/index";
import SnackabraStore from "stores/Snackabra.Store";
import ChannelStore from "stores/Channel.Store";

export type Stores = {
    snackabraStore: SnackabraStore;
    channelStore: ChannelStore;
};

export { stores };

