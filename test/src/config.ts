import * as __ from "lib384"

interface Config extends __.SBServer {
  mode?: "development" | "production";
  vault_from_384_os?: string;
  jwk_from_384_os?: JsonWebKey;
  salt: ArrayBufferLike;
  iterations: number;
  message_namespace: string;
}



const config_assert = (key: string) => {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined`);
  }
}

const configKeys = [
  "REACT_APP_CHANNEL_SERVER",
  "REACT_APP_CHANNEL_SERVER_WS",
  "REACT_APP_STORAGE_SERVER",
  "REACT_APP_MODE",
  "REACT_APP_WALLET_FROM_384_OS",
  "REACT_APP_JWK_FROM_384_OS",
  "REACT_APP_SALT",
  "REACT_APP_ITERATIONS"
]

for (const key of configKeys) {
  config_assert(key)
}


export const config: Config = {
  channel_server: process.env.REACT_APP_CHANNEL_SERVER as string,
  channel_ws: process.env.REACT_APP_CHANNEL_SERVER_WS as string,
  storage_server: process.env.REACT_APP_STORAGE_SERVER as string,
  mode: process.env.REACT_APP_MODE as "development" | "production",
  vault_from_384_os: process.env.REACT_APP_WALLET_FROM_384_OS ,
  jwk_from_384_os: process.env.REACT_APP_JWK_FROM_384_OS ? JSON.parse(process.env.REACT_APP_JWK_FROM_384_OS) : undefined,
  salt: new Uint8Array(JSON.parse(process.env.REACT_APP_SALT as string)),
  iterations: parseInt(process.env.REACT_APP_ITERATIONS as string),
  message_namespace: process.env.REACT_APP_MESSAGE_NAMESPACE ? process.env.REACT_APP_MESSAGE_NAMESPACE :'',
};
