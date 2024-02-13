import React, { createContext, useContext, useState } from 'react';
import { useVault } from '../VaultContext/VaultContext';
import * as __ from 'lib384v2/dist/384.esm.js'
import { useSnackabra } from '../SnackabraContext/SnackabraContext';
import { jwkFromPassphrase } from '../../../v1/utils/Vault';
import IndexedKV from '../../../utils/IndexedKV';


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

export const UserAuthContext = createContext<UserAuthContextType>({
  user: null,
  ready: false,
  digestControlPlaneMessages: async () => { },
  encapsulateKey: async () => { },
  getIdentityFromEmail: async () => { return '' },
  getJWKFromEmail: async () => { return {} as JsonWebKey },
  login: async () => { return false },
  registerInvite: async () => { return false },
  logout: () => { },
  register: async () => { return false },
  channel: null,
  isLoggedIn: false,
  hasUser: async () => { return false },
  knownUsers: new Map(),
});

// Custom hook to access the UserAuthContext
export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}

interface UserAuthProviderProps extends React.PropsWithChildren<{}> {
  children: React.ReactNode;
  onFailedLogin?: () => void;
  onLogout?: () => void;
  config: any;
};

// UserAuthContext Provider Component
export function UserAuthProvider(props: UserAuthProviderProps) {
  const authDb = React.useRef(new IndexedKV({ db: "authCache", table: "data" }));
  const readyResolver = React.useRef<any>(null)
  const readyFlag = React.useRef<Promise<boolean>>()
  const SB = useSnackabra()
  const vault = useVault()
  const loadingTimer = React.useRef<any>(null)
  const possibleKeyPackages = React.useRef<KeyPackage[]>([])
  const sessionTimerRef = React.useRef<any>(null)
  // Initialize the user state with null (not authenticated)
  const [user, setUser] = useState<User | null>(null);
  const [channel, setUserChannel] = useState<ChannelStore | null>(null);
  const [knownUsers, setKnownUser] = useState<Map<string, string>>(new Map())
  const [invitedUsers, setInvitedUsers] = useState<Map<string, string>>(new Map())
  const [messages, setMessages] = useState<any[]>([])
  const [ready, setReady] = useState<boolean>(false)
  const [rememberLogin, setRememberLogin] = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  React.useEffect(() => {

    readyFlag.current = new Promise((resolve) => {
      readyResolver.current = resolve
    })

  }, [])

  React.useEffect(() => {
    if (ready) {
      readyResolver.current(true)
    }
  }, [ready])

  React.useEffect(() => {
    authDb.current.getItem('user').then((_user: any) => {
      const checked = localStorage.getItem('checked') === 'true'
      setRememberLogin(checked)
      if (_user && checked) {
        setUser(_user)
      }
    })
    authDb.current.getItem('knownUsers').then((_knownUsers: any) => {
      if (_knownUsers && _knownUsers instanceof Map) {
        setKnownUser(_knownUsers)
      }
    })
    authDb.current.getItem('invitedUsers').then((_invitedUsers: any) => {
      if (_invitedUsers && _invitedUsers instanceof Map) {
        setInvitedUsers(_invitedUsers)
      }
    })
    authDb.current.getItem('messages').then((_messages: any) => {
      if (_messages) {
        setMessages(_messages)
      }
    })
    authDb.current.getItem('possibleKeyPackages').then((_possibleKeyPackages: any) => {
      if (_possibleKeyPackages && _possibleKeyPackages.length > 0) {
        _possibleKeyPackages.forEach((k: KeyPackage) => {
          possibleKeyPackages.current.push(k)
        })
      }
    })

  }, [])

  React.useEffect(() => {
    if (user && rememberLogin) {
      authDb.current.setItem('user', user)
    }
    if (knownUsers) {
      authDb.current.setItem('knownUsers', knownUsers)
    }
    if (invitedUsers) {
      authDb.current.setItem('invitedUsers', invitedUsers)
    }
    if (messages) {
      authDb.current.setItem('messages', messages)
    }
    if (possibleKeyPackages) {
      authDb.current.setItem('possibleKeyPackages', possibleKeyPackages)
    }

  }, [rememberLogin, invitedUsers, knownUsers, user, channel, messages, authDb])

  React.useEffect(() => {
    if (vault.id && vault.identity && !isLoggedIn) {
      const channelId = localStorage.getItem('channelId');
      if (channelId && isValideSessionTimeout()) {
        proceedWithLogin();
      }
    }
  }, [vault, isLoggedIn]);

  React.useEffect(() => {
    digestControlPlaneMessages(vault.controlPlaneMessages)
  }, [vault.controlPlaneMessages])

  React.useEffect(() => {
    if (!vault.id) return
    if (!vault.identity) return
    const channelId = localStorage.getItem('channelId')
    if (channelId && SB && !channel) {
      connect(channelId)
    }
  }, [vault, SB, channel])

  React.useEffect(() => {
    if (user && user.channelId && rememberLogin) {
      localStorage.setItem('channelId', user.channelId)
    }
    if (user && user.channelId) {
      proceedWithLogin()
      document.addEventListener('mousemove', setSessionTimeoutInLocalStorage);
      document.addEventListener('keypress', setSessionTimeoutInLocalStorage);
    }
    return () => {
      document.removeEventListener('mousemove', setSessionTimeoutInLocalStorage);
      document.removeEventListener('keypress', setSessionTimeoutInLocalStorage);
      clearInterval(sessionTimerRef.current)
    }
  }, [user, rememberLogin])

  const assert_initialized = () => {
    if (!vault.id) return
    if (!vault.identity) return
    if (!SB.store) throw new Error('SB not initialized')
  }

  const connect = async (channelId: string) => {
    let _channel = SB.store!.channels[channelId] as ChannelStore
    if (_channel) {
      await _channel.connect()
      setUserChannel(_channel)
      return true
    }
    return false
  }

  const proceedWithLogin = async () => {
    const loggedin = await joinOrConnect()

    if (loggedin) {
      setSessionTimeoutInLocalStorage()
      setIsLoggedIn(true)
      sessionTimerRef.current = setInterval(() => {
        if (!isValideSessionTimeout() && !rememberLogin) {
          logout()
        }
      }, 1000)
    } else {
      console.error('Failed to join or connect')
    }
  }

  const isValideSessionTimeout = () => {
    const timeout = localStorage.getItem('sessionTimeout')
    const remember = localStorage.getItem('checked')
    if (remember) return true
    if (!timeout) return false
    const now = new Date()
    const timeoutDate = new Date(parseInt(timeout))
    if (now > timeoutDate) {
      return false
    }
    return true
  }

  const setSessionTimeoutInLocalStorage = () => {
    const now = new Date()
    const timeout = now.setHours(now.getHours() + 1)
    localStorage.setItem('sessionTimeout', timeout.toString())
  }

  const joinOrConnect = async () => {
    const channelId = user?.channelId ? user.channelId : localStorage.getItem('channelId')
    if (SB && channelId) {
      if (await connect(channelId)) {
        localStorage.setItem('channelId', channelId)
        return true
      } else {
        if (!user) return false
        const c = await SB.store!.joinChannel(user.channelId, user.key)
        console.log('joined')
        setUserChannel(c)
        localStorage.setItem('channelId', user.channelId)
        return true
      }
    }
    return false
  }

  const getIdentityFromEmail = async (email: string): Promise<string> => {
    const identityJWK = await getJwk(email)
    return identityJWK.x + ' ' + identityJWK.y
  }

  const getJWKFromEmail = async (email: string): Promise<JsonWebKey> => {
    return await getJwk(email)
  }

  const getJwk = async (email: string): Promise<JsonWebKey> => {
    try {
      const salt = stringToUint8Array(email)
      const jwk = await jwkFromPassphrase(email, { salt: salt, iterations: props.config.iterations }) as JsonWebKey
      if (!jwk) throw new Error('Failed to get JWK')
      return jwk
    } catch (e) {
      console.error(e)
      return await getJwk(email + email)
    }
  }

  const digestControlPlaneMessages = async (messages: any[]) => {
    const knownUsersArray: KnownUser[] = []
    const keyPackages: KeyPackage[] = []
    const invites: any[] = []
    for (let i in messages) {
      const msg = messages[i]
      switch (msg.messageType) {
        case vault.KeyClaimMessageType:
          keyPackages.push(msg)
          break
        case vault.KnownUsersMessageType:
          knownUsersArray.push(msg)
          break
        case vault.InviteMessageType:
          if (!msg.claimed) {
            invites.push(msg)
          }
          break
        default:
          console.log('unknown message type in control plane')
          break
      }
    }
    Promise.all([
      addKnownUsers(knownUsersArray),
      addPossibleKeyPackages(keyPackages),
      addInvites(invites)
    ]).then(() => {
      // alert('New messages received')
      console.log(possibleKeyPackages.current)
      console.log(knownUsers)
      setMessages((_messages: any) => [..._messages, ...messages])
      setReady(true)

    })
  }

  const addKnownUsers = async (knownUsersArray: KnownUser[]) => {

    for (let i in knownUsersArray) {
      const msg = knownUsersArray[i]
      knownUsers.set(msg.x + ' ' + msg.y, msg.x + ' ' + msg.y)
    }
    return true
  }

  const addInvites = async (invites: any[]) => {
    for (let i in invites) {
      const msg = invites[i]
      invitedUsers.set(msg.x + ' ' + msg.y, msg.x + ' ' + msg.y)
    }
    return true
  }

  const addPossibleKeyPackages = async (keyPackages: KeyPackage[]) => {
    const packages: KeyPackage[] = []
    for (let i in keyPackages) {
      const pkg = {
        claimingPubKey: keyPackages[i].claimingPubKey,
        passPhraseSalt: new Uint8Array(Object.values(keyPackages[i].passPhraseSalt)),
        passPhraseIterations: keyPackages[i].passPhraseIterations,
        data: new Uint8Array(Object.values(keyPackages[i].data)),
        key: null,
        iv: new Uint8Array(Object.values(keyPackages[i].iv)),
      }
      packages.push(pkg)

    }
    possibleKeyPackages.current = [...possibleKeyPackages.current, ...packages]
    return true
  }


  function getDecryptPromise(keyPackage: KeyPackage) {
    return window.crypto.subtle
      .decrypt(
        {
          name: "AES-GCM",
          iv: keyPackage.iv
        },
        keyPackage.key as CryptoKey,
        keyPackage.data
      )
      .then((decryptedData) => {
        const decrypted = JSON.parse(new TextDecoder().decode(decryptedData));
        setUser(decrypted)
        return true
      })
      .catch((e) => {
        console.warn(`**** failed to decrypt my claimed: ${e}`)
        return false
      });
  }

  const login = (email: string, password: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      await readyFlag.current
      let promiseArray = []
      const salt = stringToUint8Array(email)
      for (let i in possibleKeyPackages.current) {
        const saltBuf = salt.buffer;
        const recreatedKey = await __.strongphrase.recreateKey(password, saltBuf as any, props.config.iterations)
        possibleKeyPackages.current[i].key = recreatedKey.key as JsonWebKey
        promiseArray.push(getDecryptPromise(possibleKeyPackages.current[i]))
      }
      Promise.all(promiseArray).then(async (results) => {
        if (results.includes(true)) {
          resolve(true)
        } else {
          reject(Error('Failed to decrypt'))
        }
      })
    })
  };

  // Function to handle user logout
  const logout = () => {
    localStorage.removeItem('channelId')
    localStorage.removeItem('sessionTimeout')
    resetUserAuthState()
    if (props.onLogout && typeof props.onLogout === 'function') {
      props.onLogout()
    }
  };

  const hasUser = async (email: string): Promise<boolean> => {
    const id = await getIdentityFromEmail(email)

    if (knownUsers.has(id)) {
      return true
    } else {
      return false
    }
  }

  const resetUserAuthState = () => {
    setUser(null);
    setUserChannel(null);
    setReady(false)
    setIsLoggedIn(false)
  }

  function stringToUint8Array(str: string) {
    // Step 1: Convert the string to an array of UTF-8 encoded bytes
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(str);

    // Step 2: Create a Uint8Array from the UTF-8 bytes
    const uint8Array = new Uint8Array(utf8Bytes);

    return uint8Array;
  }

  async function encapsulateKey(channelData: { channelId: string, key: JsonWebKey }, strongKey: { key: CryptoKey; salt: Uint8Array; iterations: number; }) {
    // Convert the JWK to a JSON string and then to an ArrayBuffer
    const keyData = new TextEncoder().encode(JSON.stringify(channelData));

    const claimingPubKey = channelData.key.x + ' ' + channelData.key.y

    // Generate nonce for the encapsulation
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the key data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      strongKey.key,
      keyData
    );

    // Return the IV and the encrypted data
    return {
      // who are we claiming this for?
      claimingPubKey: claimingPubKey,
      // salt and iteration count used to derive key from phrase
      passPhraseSalt: new Uint8Array(),
      passPhraseIterations: strongKey.iterations,
      // our private (main) key that we want to use
      data: new Uint8Array(encryptedData),
      // the nonce we used to protect our private 'main' key
      iv: iv,
      key: null
    };
  }

  const registerInvite = async (channelId: string, from: string): Promise<boolean> => {
    try {
      assert_initialized()
      const _msg = {
        text: JSON.stringify({
          id: from,
          channelId: channelId,
          from: from,
          messageType: 'DASHBOARD_INVITES_CLAIMS_V1',
        })
      }
      if (!channel) throw new Error('Channel not initialized')
      await channel.sendMessage(_msg)
      return true
    } catch (e) {
      console.error(e)
      return false;
    }

  }

  const register = async (email: string, password: string): Promise<boolean> => {
    assert_initialized()
    const salt = stringToUint8Array(email)

    // this is not safe to be used for any kind of crypto, this is a zero knowledge proof for the user identity only
    const identityJWK = await getJWKFromEmail(email)
    console.log(knownUsers)
    if (knownUsers.has(identityJWK.x + ' ' + identityJWK.y)) {
      console.log('User already exists')
      alert('User already exists')
      return false
    }
    try {

      await vault.sendKnownUser({ x: identityJWK.x, y: identityJWK.y })
      knownUsers.set(identityJWK.x + ' ' + identityJWK.y, identityJWK.x + ' ' + identityJWK.y)
      const identity = await __.strongphrase.recreateKey(password, salt, props.config.iterations)
      console.log(identity)
      const channelEndpoint = new __.NewSB.ChannelEndpoint(SB.store!.config, vault.identity, vault.id as string)
      const SBServer = new __.NewSB.Snackabra(SB.store!.config)
      const c = await SBServer.create(SB.store!.config, channelEndpoint)
      if (c) {
        const _e_key = await encapsulateKey(c, identity)
        console.log(_e_key)
        vault.sendKeyClaim(_e_key)
        await addPossibleKeyPackages([_e_key])
        return true
      } else {
        console.error('Failed to create channel')
        return false

      }
    } catch (e) {
      console.error(e)
      knownUsers.delete(identityJWK.x + ' ' + identityJWK.y)
      return false;
    }

  }

  // Provide the user state and authentication functions to the app
  const contextValue: UserAuthContextType = {
    user,
    digestControlPlaneMessages,
    getIdentityFromEmail,
    getJWKFromEmail,
    encapsulateKey,
    login,
    registerInvite,
    logout,
    register,
    channel,
    ready,
    isLoggedIn,
    hasUser,
    knownUsers,
  };

  return (
    <UserAuthContext.Provider value={contextValue}>
      {props.children}
    </UserAuthContext.Provider>
  );
}