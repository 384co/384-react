import React, { ReactNode } from "react";
import { IVaultContextInterface } from "./VaultContext.d";
import { VaultConfig } from "../Provide384/Provide384.d";
declare const VaultContext: React.Context<IVaultContextInterface>;
export declare const useVault: () => IVaultContextInterface;
export declare const VaultProvider: ({ children, config }: {
    children: ReactNode;
    config: VaultConfig;
}) => React.JSX.Element;
export default VaultContext;
