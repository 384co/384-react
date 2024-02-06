import * as React from "react";
import { SnackabraProviderProps, SBFileHelperContextContextType } from "./SBFileHelperContext.d";
declare const SBFileHelperContext: React.Context<SBFileHelperContextContextType>;
export declare const useSBFH: () => SBFileHelperContextContextType;
export declare function SBFileHelperProvider({ children, config }: SnackabraProviderProps): React.JSX.Element;
export default SBFileHelperContext;
