import { ChannelStore } from '../../stores/ChannelStore/Channel.Store';

// Define the User type to represent user data
export type User = {
  channelId: string;
  key: JsonWebKey;
  // Add other user properties as needed
};

export type KeyPackage = {
  claimingPubKey: string,
  passPhraseSalt: Uint8Array
  passPhraseIterations: number
  data: Uint8Array;
  key: CryptoKey | JsonWebKey | null;
  iv: Uint8Array
}

export type KnownUser = {
  key: string,
  x: string,
  y: string,
}


// Create the UserAuthContext
export type UserAuthContextType = {
  user: User | null;
  ready: boolean
  digestControlPlaneMessages: (messages: any[]) => Promise<void>;
  getIdentityFromEmail: (email: string) => Promise<string>
  getJWKFromEmail: (email: string) => Promise<JsonWebKey>
  encapsulateKey: (channelData: { channelId: string, key: JsonWebKey }, strongKey: { key: CryptoKey; salt: Uint8Array; iterations: number; }) => Promise<any>
  login: (email: string, password: string) => Promise<boolean>;
  registerInvite: (channelId: string, from: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string) => Promise<boolean>
  channel: ChannelStore | null
  isLoggedIn: boolean
  hasUser: (email: string) => Promise<boolean>
  knownUsers: Map<string, string>
};