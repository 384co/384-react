import { VaultOptions } from './Vault.d';
export declare function vaultFromStrongpin(strongpin: string, options: VaultOptions): Promise<JsonWebKey | null>;
export declare function jwkFromPassphrase(strongphrase: string, options: VaultOptions): Promise<JsonWebKey | null>;
export declare function generateRandomVault(options: VaultOptions): Promise<{
    strongpin: string;
    jwk: JsonWebKey;
} | null>;
