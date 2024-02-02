import * as React from "react"
import * as __ from "lib384"
import { SnackabraStoreType } from "stores/Snackabra.Store";
import {stores} from "stores/index"

export type SnackabraContextType = SnackabraStoreType | null

export interface SnackabraProviderProps extends React.PropsWithChildren<{}> {
  config: __.SnackabraTypes.SBServer
}

const SnackabraContext = React.createContext<SnackabraContextType>({} as unknown as SnackabraStoreType);

export const useSnackabra = () => {
  const context = React.useContext(SnackabraContext);
  if (context === undefined) {
    throw new Error('useSnackabra must be used within a SnackabraProvider');
  }
  return context;
}

export function SnackabraProvider({ children, config }: SnackabraProviderProps) {
  const [ready, setReady] = React.useState<boolean>(false)
  const [sbContext, setSBContext] = React.useState<SnackabraStoreType | null>(null)

  React.useEffect(() => {
    // this is the one global SB object for the app
    const sbContext = new stores.SB(config)
    sbContext.ready.then(() => {
      setSBContext(sbContext)
      setReady(true)
    })
  }, [ready])

  React.useEffect(() => {
    if (sbContext && ready) {
      console.warn("==== SB (Context) Store is ready")
      console.log(sbContext)
    }
  }, [sbContext, ready])


  return (<>
    {
      ready ?
        <SnackabraContext.Provider value={sbContext}>
          {children}
        </SnackabraContext.Provider>
        : null
    }
  </>)

};
