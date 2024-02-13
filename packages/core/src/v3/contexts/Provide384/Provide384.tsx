import * as React from "react"
import * as __ from "lib384"
import { SnackabraProvider } from "../SnackabraContext/SnackabraContext";
import AuthProvider from "../AuthContext";
import SBFileHelperProvider from "../SBFileHelperContext";
import VaultProvider from "../VaultContext";

// 'staging': {
//     wallet: {
//         "userPrivateKey": env.stagingWalletHandle.userPrivateKey,
//         "channelServer": env.stagingWalletHandle.channelServer,
//     },

//     walletHandle: env.stagingWalletHandle,
//     ledgerHandle: env.stagingLedgerHandle,

//     // v3 we don't treat shard server as a separate server (yet)
//     channelServer: 'https://c3.384.dev',
//     storageServer: 'https://s3.384.dev',
//     appServer:     'https://v3.384.dev',

//     // with v3 we're using Pages for library distro
//     jslibShardHandle: {
//         // coming soon
//     },

//     lib384key: env.stagingLib384Key,
// },


export interface ServerConfig {
    channelServer: string
    storageServer: string
    appServer: string
}
export interface VaultConfig {
    message_namespace?: string
    vault_from_384_os?: string //     walletHandle: env.stagingWalletHandle,
    ledger_from_384_os?: string //     ledgerHandle: env.stagingLedgerHandle,
}

export interface AppConfig extends VaultConfig, ServerConfig {
    salt?: Uint8Array,
    iterations?: number,
}

export interface React384ContextType extends React.PropsWithChildren<{}> {
    config: AppConfig
    children?: React.ReactNode
}



const React384Context = React.createContext({});

export const use384 = () => {
    const context = React.useContext(React384Context);
    if (context === undefined) {
        throw new Error('useSnackabra must be used within a SnackabraProvider');
    }
    return context;
}

export function Provide384({ children, config }: React384ContextType) {
    if (!config) throw new Error('Provide384 requires a config object')
    const SBConfig = {
        channel_server: config.channel_server,
        channel_ws: config.channel_ws,
        storage_server: config.storage_server,
    }

    const appConfig: AppConfig = {
        ...SBConfig,
        salt: config.salt || new Uint8Array([226, 116, 233, 66, 39, 174, 243, 10, 71, 162, 47, 32, 187, 120, 215, 105]),
        iterations: config.iterations || 1000000
    }

    const vConfig: VaultConfig = {
        message_namespace: typeof config.message_namespace === 'string' ? config.message_namespace : '384_OS_',
        vault_from_384_os: config.vault_from_384_os,
        jwk_from_384_os: config.jwk_from_384_os
    }

    return (
        <SnackabraProvider config={SBConfig}>
            <SBFileHelperProvider config={SBConfig}>
                <AuthProvider config={appConfig}>
                    <VaultProvider config={vConfig}>
                        {children}
                    </VaultProvider>
                </AuthProvider>
            </SBFileHelperProvider>
        </SnackabraProvider>
    )

};
