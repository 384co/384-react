import React, { ReactNode } from "react"
import { useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import IndexedKV from "utils/IndexedKV";
import * as __ from 'lib384/dist/384.esm.js'
import { useSnackabra } from "./SnackabraContext";
import { ChannelStoreType } from "stores/Channel.Store";
import { WalletConfig } from "contexts";


//https://preview.384chat.pages.dev/f1r7X7TMNvmeA637At3tEL9PfSoWscU3QD68PtpRELRdTDYl8Hm62RL3CRYbxh0i

interface IWallet {
  channelId?: string
  key?: JsonWebKey
  walletId: string
  originalLimit: number
}

interface IWalletContextInterface {
  wallet: IWallet | null,
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

const WalletContext = React.createContext<IWalletContextInterface>({
  wallet: null,
  id: null,
  identity: null,
  controlPlaneMessages: [],
  sendKnownUser: async () => { return {} },
  sendKeyClaim: async () => { return {} },
  setWallet: () => { },
  destroy: () => { },
  setStrongPinJwk: () => { },
  KeyClaimMessageType: '',
  KnownUsersMessageType: '',
  InviteMessageType: '',

});


export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children, config }: { children: ReactNode, config:  WalletConfig}) => {
  const KeyClaimMessageType = config.message_namespace + 'KEY_CLAIM_V3'
  const KnownUsersMessageType = config.message_namespace + 'KNOWN_USERS_V3'
  const InviteMessageType = config.message_namespace + 'INVITE_V3'
  const walletDb = new IndexedKV({ db: "data", table: "wallet" });
  const auth = useAuth()
  const SB = useSnackabra()
  const [wallet, setWallet] = React.useState<IWallet | null>(null);
  const [identity, setIdentity] = React.useState<any>(null);
  const [id, setId] = React.useState<any>(null);
  const [registration, setRegistration] = React.useState<any>(null);
  const [channel, setChannel] = React.useState<ChannelStoreType | null>(null);
  const [controlPlaneMessages, setControlPlaneMessages] = React.useState<any[]>([])

  useEffect(() => {
    if (channel) {
      if (channel?.messages) {
        receiveMessages(channel?.messages)
      }
    }
  }, [channel])

  useEffect(() => {

    loadWallet()
  }, [])

  useEffect(() => {
    if (!config.wallet_from_384_os || !config.jwk_from_384_os || !SB) return
    setId(config.wallet_from_384_os)
    setIdentity(config.jwk_from_384_os)
    let _channel = SB.channels[config.wallet_from_384_os] as ChannelStoreType
    if (_channel) {
      console.log('already joined')
      _channel.connect()
      setChannel(_channel)
    } else {
      SB.joinChannel(config.wallet_from_384_os, config.jwk_from_384_os).then((c: ChannelStoreType) => {
        console.log('joined')
        setChannel(c)
      })
    }

  }, [])

  useEffect(() => {
    if (!auth.isReady || !registration) return
    auth.encrypt(JSON.stringify(registration)).then((e) => {
      if (e) {
        console.log(e)
        walletDb.setItem(registration.channelId + '_wallet', encodeURIComponent(e.string()))
        auth.prompt(e.string())
      } else {
        throw new Error('something broke!')
      }
    })
  }, [auth.isReady, registration])

  useEffect(() => {
    if (auth.afterAuth) {
      onAuth(auth.afterAuth)
    }
  }, [auth.afterAuth])

  const loadWallet = async () => {
    walletDb.openCursor(/_wallet/, (w: any) => {
      if (w.length === 0) return
      console.log(w)
      auth.prompt(decodeURIComponent(w[0].value))
    })
  }

  const onAuth = (d: string) => {
    const wallet = JSON.parse(d)
    setIdentity(wallet.key)
    setId(wallet.channelId)
    setWallet(wallet)
  }

  const destroy = async () => {
    console.log('destroying wallet', id + '_wallet')
    walletDb.removeItem(id + '_wallet').then(() => {
      console.log('wallet destroyed')
      window.location.reload()
    }).catch((e) => {
      console.error(e)
    })

  }

  const setStrongPinJwk = (jwk: JsonWebKey) => {
    setIdentity(jwk)
  }

  const handleKeyClaim = async (msg: any) => {
    return msg;
  }

  const handleKnownUser = async (msg: any) => {
    return msg;
  }


  const receiveMessages = async (msgs: any[]) => {
    const messagePromises = []

    for (let i in msgs) {
      const msg = JSON.parse(msgs[i].text)
      switch (msg.messageType) {
        case KeyClaimMessageType:
          messagePromises.push(handleKeyClaim(msg))
          break
        case KnownUsersMessageType:
          messagePromises.push(handleKnownUser(msg))
          break
        default:
          console.log('unknown message type in control plane')
          break
      }
    }

    Promise.all(messagePromises).then((results) => {
      setControlPlaneMessages(results)
    })
  }

  const sendKnownUser = (user: any) => {
    const _user = {
      text: JSON.stringify({
        x: user.x,
        y: user.y,
        messageType: KnownUsersMessageType,
      })
    }
    return channel?.sendMessage(_user) as Promise<__.SnackabraTypes.ChannelMessage>

  }

  const sendKeyClaim = (claim: any) => {
    const _claim = {
      text: JSON.stringify({
        ...claim,
        messageType: KeyClaimMessageType,
      })
    }
    handleKeyClaim(_claim)
    return channel?.sendMessage(_claim) as Promise<__.SnackabraTypes.ChannelMessage>
  }

  return (<WalletContext.Provider value={{
    wallet,
    id,
    identity,
    setWallet,
    sendKnownUser,
    sendKeyClaim,
    destroy,
    controlPlaneMessages,
    setStrongPinJwk,
    KeyClaimMessageType,
    KnownUsersMessageType,
    InviteMessageType,
  }}>{children} </WalletContext.Provider>)
};

export default WalletContext;

