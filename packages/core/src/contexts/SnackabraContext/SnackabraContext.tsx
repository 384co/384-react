import * as React from "react"
import { observer } from "mobx-react";
import { SnackabraTypes } from "lib384"
import { SnackabraStore } from "../../stores"

export type SnackabraContextType = {
  store: SnackabraStore | null
}

export interface SnackabraProviderProps {
  config: SnackabraTypes.SBServer
  children?: React.ReactNode
}

const SnackabraContext = React.createContext<SnackabraContextType>({
  store: null
});

export const useSnackabra = () => {
  const context = React.useContext(SnackabraContext);
  if (context === undefined) {
    throw new Error('useSnackabra must be used within a SnackabraProvider');
  }
  return context;
}

export const SnackabraProvider = observer((props: SnackabraProviderProps) => {
  const {children, config} = props
  const [ready, setReady] = React.useState<boolean>(false)
  const [store, setSBContext] = React.useState<SnackabraStore | null>(null)


  React.useEffect(() => {
    // this is the one global SB object for the app
    const _sbContext = new SnackabraStore(config)
    _sbContext.ready.then(() => {
      setSBContext(_sbContext)
    })
  }, [config, ready])

  React.useEffect(() => {
    if (store && ready) {
      console.warn("==== SB (Context) Store is ready")
      console.log(store)
    }
  }, [store, ready])

  React.useEffect(() => {
    if (store) {
      setReady(true)
    }
  }, [store])


  return (<>
    {
      ready ?
        <SnackabraContext.Provider value={{
          store: store
        }}>
          {children}
        </SnackabraContext.Provider>
        : null
    }
  </>)

});
