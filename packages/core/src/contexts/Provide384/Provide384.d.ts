import { SBServer } from "lib384";

export interface VaultConfig {
    message_namespace?: string
    vault_from_384_os?: string
    jwk_from_384_os?: JsonWebKey
}

export interface AppConfig extends VaultConfig, SBServer {
    salt?: Uint8Array,
    iterations?: number,
}

export interface React384ContextType extends React.PropsWithChildren<{}> {
    config: AppConfig
    children?: React.ReactNode
}
