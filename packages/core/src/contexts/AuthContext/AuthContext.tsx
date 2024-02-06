import * as React from "react"
import { observer } from "mobx-react";
import { _i_encrypt, _i_decrypt } from "../../utils/LocalCrypto/LocalCrypto";
import { jwkFromPassphrase } from '../../utils/Vault/Vault';
import { AuthProviderProps, IAuthContextInterface, IEncrypted, IDecrypted } from './AuthContext.d'

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

const AuthContext = React.createContext<IAuthContextInterface>({
  prompt: () => { },
  decrypt: () => { return new Promise(() => { }) },
  encrypt: () => { return new Promise(() => { }) },
  encrypted: null,
  promptCallback: () => { },
  promptOpen: false,
  afterAuth: null,
  setAfterAuth: null,
  isReady: false,
  jwk: null,
  setPassPhrase: () => { return new Promise(() => { }) }
});

export const AuthProvider = observer(({ children, config }: AuthProviderProps) => {
  const [promptOpen, setPromptOpen] = React.useState(false)
  const [promptCallback, setPromptCallback] = React.useState<() => void>(() => { })
  const [afterAuth, setAfterAuth] = React.useState(null)
  const [encrypted, setEncrypted] = React.useState(null as string | null)
  const [jwk, setJwk] = React.useState(null as JsonWebKey | null)
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    console.log(encrypted)
  }, [encrypted])

  React.useEffect(() => {
    if (jwk && !isReady) {
      console.log('JWK is ready', jwk)
      setIsReady(true)
    }
  }, [isReady, jwk])

  const encrypt = (data: any): Promise<IEncrypted | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(this)
        if (jwk === null) throw new Error('No JWK')
        resolve(await _i_encrypt(data, jwk))
      } catch (e) {
        console.error(e)
        reject(e);
      }
    })
  }

  const decrypt = (): Promise<IDecrypted | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (jwk === null) throw new Error('No JWK')
        if (encrypted === null) {
          reject('No encrypted data')
        } else {
          const decrypted = await _i_decrypt(encrypted, jwk)
          if (decrypted) {
            setPromptOpen(false)
          }
          resolve(decrypted)
        }

      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }

  const prompt = (data: string) => {
    setPromptOpen(true)
    setEncrypted(data)
  }

  const setPassPhrase = async (password: string) => {
    const jwkFromStrongPhrase = await jwkFromPassphrase(password, { salt: config.salt, iterations: config.iterations })
    if (!jwkFromStrongPhrase) throw new Error('No JWK')
    setJwk(jwkFromStrongPhrase)
    console.log("Generated JWK from strongphrase:", jwkFromStrongPhrase)
    return jwkFromStrongPhrase
  }

  return (<AuthContext.Provider value={{
    prompt,
    decrypt,
    encrypt,
    encrypted,
    promptCallback,
    promptOpen,
    afterAuth,
    setAfterAuth,
    setPassPhrase,
    isReady,
    jwk
  }}>{children} </AuthContext.Provider>)
});

export default AuthContext;

