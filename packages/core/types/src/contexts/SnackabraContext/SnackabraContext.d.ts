import * as React from "react";
import { SnackabraTypes } from "lib384";
import { SnackabraStore } from "../../stores";
export type SnackabraContextType = {
    store: SnackabraStore | null;
};
export interface SnackabraProviderProps extends React.PropsWithChildren<{}> {
    config: SnackabraTypes.SBServer;
}
export declare const useSnackabra: () => SnackabraContextType;
export declare function SnackabraProvider({ children, config }: SnackabraProviderProps): React.JSX.Element;
