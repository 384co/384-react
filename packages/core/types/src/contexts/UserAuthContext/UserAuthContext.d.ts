import React from 'react';
import { UserAuthContextType } from './UserAuthContext.d';
export declare const UserAuthContext: React.Context<UserAuthContextType>;
export declare function useUserAuth(): UserAuthContextType;
interface UserAuthProviderProps extends React.PropsWithChildren<{}> {
    children: React.ReactNode;
    onFailedLogin: () => void;
    onLogout: () => void;
    config: any;
}
export declare function UserAuthProvider(props: UserAuthProviderProps): React.JSX.Element;
export {};
