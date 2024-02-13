import { Portal, Snackbar, Alert } from "@mui/material";
import React, { useState, ReactNode, useContext } from "react";

type NotificationContext = {
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  severity: "error" | "info" | "success" | "warning" | undefined,
  setSeverity: React.Dispatch<React.SetStateAction<"error" | "info" | "success" | "warning" | undefined>>,
  message: string,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  action: ReactNode | string,
  setAction: React.Dispatch<React.SetStateAction<ReactNode | string>>,
  autoHideDuration: number,
  setAutoHideDuration: React.Dispatch<React.SetStateAction<number>>
  showError: (message: string, action?: ReactNode | string) => void
  showSuccess: (message: string, action?: ReactNode | string) => void
  showWarning: (message: string, action?: ReactNode | string) => void
  showInfo: (message: string, action?: ReactNode | string) => void
}

const NotificationContext = React.createContext<NotificationContext>({
  open: false,
  setOpen: () => { },
  severity: "info",
  setSeverity: () => { },
  message: "",
  setMessage: () => { },
  action: "",
  setAction: () => { },
  autoHideDuration: 6000,
  setAutoHideDuration: () => { },
  showError: () => { },
  showSuccess: () => { },
  showWarning: () => { },
  showInfo: () => { }
});

// Custom hook to access the UserAuthContext
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}

type NotificationBarProps = {
  vertical: "top" | "bottom",
  horizontal: "left" | "center" | "right",
  onClose: CallableFunction,
  open: boolean,
  severity: "error" | "info" | "success" | "warning" | undefined
  autoHideDuration: number,
  message: string,
  action: ReactNode | string
}


function NotificationBar(props: NotificationBarProps) {
  const [state, setState] = React.useState({
    open: props.open,
    message: props.message,
    severity: props.severity,
    action: props.action,
    autoHideDuration: props.autoHideDuration,
    horizontal: props.horizontal,
    vertical: props.vertical
  })
  React.useEffect(() => {
    setState({
      open: props.open,
      message: props.message,
      severity: props.severity,
      action: props.action,
      autoHideDuration: props.autoHideDuration,
      horizontal: props.horizontal,
      vertical: props.vertical
    })

  }, [props.open, props.message, props.severity, props.action, props.autoHideDuration, props.horizontal, props.vertical])

  const handleClose = () => {
    props.onClose();
  };

  return (
    <Portal>
      <Snackbar
        id={'notification-bar-' + state.severity}
        anchorOrigin={{
          vertical: state.vertical,
          horizontal: state.horizontal,
        }}
        open={state.open}
        onClose={handleClose}
        autoHideDuration={state.autoHideDuration}
      >
        <Alert classes={{ message: 'message-overflow' }} onClose={handleClose} severity={state.severity}>
          {state.message}
          {state.action}
        </Alert>
      </Snackbar>
    </Portal>
  );
}

export const Provider = ({ children }: { children: ReactNode }) => {

  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("info" as NotificationContext["severity"]);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<ReactNode | string>("");
  const [autoHideDuration, setAutoHideDuration] = useState(60000);
  const [vertical, setVertical] = useState<"top" | "bottom">("bottom");
  const [horizontal, setHorizontal] = useState<"left" | "center" | "right">("center");


  const onClose = () => {
    setOpen(false)
  }

  const showError = (message: string, action?: ReactNode | string) => {
    setSeverity('error')
    setMessage(message)
    setAction(action || '')
    setVertical('top')
    setHorizontal('center')
    setOpen(true)
  }

  const showSuccess = (message: string, action?: ReactNode | string) => {
    setSeverity('success')
    setMessage(message)
    setAction(action || '')
    setVertical('top')
    setHorizontal('center')
    setOpen(true)
  }

  const showWarning = (message: string, action?: ReactNode | string) => {
    setSeverity('warning')
    setMessage(message)
    setAction(action || '')
    setVertical('top')
    setHorizontal('center')
    setOpen(true)
  }

  const showInfo = (message: string, action?: ReactNode | string) => {
    setSeverity('info')
    setMessage(message)
    setAction(action || '')
    setVertical('top')
    setHorizontal('center')
    setOpen(true)
  }


  return (<NotificationContext.Provider value={{
    open,
    setOpen,
    severity,
    setSeverity,
    message,
    setMessage,
    action,
    setAction,
    autoHideDuration,
    setAutoHideDuration,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }}>
    {children}
    <NotificationBar
      vertical={vertical}
      horizontal={horizontal}
      open={open}
      onClose={onClose}
      severity={severity}
      autoHideDuration={autoHideDuration}
      message={message}
      action={action}

    />
  </NotificationContext.Provider>)
};

