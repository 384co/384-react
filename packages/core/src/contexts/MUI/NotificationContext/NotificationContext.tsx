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

function NotificationBar(props: { vertical: "top" | "bottom", horizontal: "left" | "center" | "right" }) {

  const context = React.useContext(NotificationContext)

  const handleClose = () => {
    context.setOpen(false);
  };

  return (
    <Portal>
      <Snackbar
        id={'notification-bar-' + context.severity}
        anchorOrigin={{
          vertical: props.vertical,
          horizontal: props.horizontal,
        }}
        open={context.open}
        onClose={handleClose}
        autoHideDuration={context.autoHideDuration}
      >
        <Alert classes={{ message: 'message-overflow' }} onClose={handleClose} severity={context.severity}>
          {context.message}
          {context.action}
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
    <NotificationBar vertical={vertical} horizontal={horizontal} />
  </NotificationContext.Provider>)
};

