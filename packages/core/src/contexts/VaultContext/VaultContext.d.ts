export interface IVault {
  channelId?: string
  key?: JsonWebKey
  walletId: string
  originalLimit: number
}

export interface IVaultContextInterface {
  wallet: IVault | null,
  id: string | null,
  identity: any,
  setWallet: React.Dispatch<React.SetStateAction<any>>,
  controlPlaneMessages: any[],
  sendKnownUser: (user: any) => Promise<__.SnackabraTypes.ChannelMessage>,
  sendKeyClaim: (claim: any) => Promise<__.SnackabraTypes.ChannelMessage>,
  destroy: () => void,
  setStrongPinJwk: (jwk: JsonWebKey) => void,
  KeyClaimMessageType: string,
  KnownUsersMessageType: string,
  InviteMessageType: string,
}