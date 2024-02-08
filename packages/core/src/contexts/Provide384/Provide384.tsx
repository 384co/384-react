import * as React from "react"
import * as __ from "lib384"
import { SnackabraProvider } from "../SnackabraContext/SnackabraContext";
import AuthProvider from "../AuthContext";
import SBFileHelperProvider from "../SBFileHelperContext";
import VaultProvider from "../VaultContext";
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
        message_namespace: config.message_namespace || '384_OS_',
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
