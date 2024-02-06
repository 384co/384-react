import * as React from "react";
import { AuthProviderProps, IAuthContextInterface } from './AuthContext.d';
export declare const useAuth: () => IAuthContextInterface;
declare const AuthContext: React.Context<IAuthContextInterface>;
export declare const AuthProvider: ({ children, config }: AuthProviderProps) => React.JSX.Element;
export default AuthContext;
