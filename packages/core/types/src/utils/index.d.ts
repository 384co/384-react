import * as vault from './Vault';
import * as misc from './Misc';
import * as decorators from './Decorators';
import * as kv from './IndexedKV';
import * as crypto from './LocalCrypto';
declare const utils: {
    vault: typeof vault;
    misc: typeof misc;
    decorators: typeof decorators;
    kv: typeof kv;
    crypto: typeof crypto;
};
export { utils, utils as default };
