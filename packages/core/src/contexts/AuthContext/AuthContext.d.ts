import { AppConfig } from "../Provide384/Provide384";
import { SnackabraProviderProps } from "../SnackabraContext/SnackabraContext.d";
export interface AuthProviderProps extends SnackabraProviderProps, React.PropsWithChildren<{}> {
  config: AppConfig
  children?: React.ReactNode
}

export type IEncrypted = {
  bytes: ArrayBufferLike,
  string: () => string,
  hex: () => string
}

export type IDecrypted = IEncrypted;

export interface IAuthContextInterface {
  prompt: (data: string) => void,
  decrypt: () => Promise<IDecrypted | null>,
  encrypt: (data: unknown) => Promise<IEncrypted | null>,
  encrypted: string | null,
  promptCallback: () => void,
  promptOpen: boolean,
  afterAuth: any,
  setAfterAuth: any,
  isReady: boolean,
  jwk: JsonWebKey | null,
  setPassPhrase: (password: string) => Promise<JsonWebKey>
}