import React, { useState, ReactNode } from "react";

interface INotificationContextInterface {
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  severity: "error" | "info" | "success" | "warning" | undefined,
  setSeverity: React.Dispatch<React.SetStateAction<"error" | "info" | "success" | "warning" | undefined>>,
  message: string,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  action: string,
  setAction: React.Dispatch<React.SetStateAction<string>>,
  autoHideDuration: number,
  setAutoHideDuration: React.Dispatch<React.SetStateAction<number>>
}


const NotificationContext = React.createContext<INotificationContextInterface>({
  open: false,
  setOpen: () => {},
  severity: "info",
  setSeverity: () => { },
  message: "",
  setMessage: () => { },
  action: "",
  setAction: () => { },
  autoHideDuration: 6000,
  setAutoHideDuration: () => { }
});


export const NotificationProvider = ({ children }: { children: ReactNode }) => {

  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("info" as INotificationContextInterface["severity"]);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("");
  const [autoHideDuration, setAutoHideDuration] = useState(6000);

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
    setAutoHideDuration
  }}>{children} </NotificationContext.Provider>)
};

export default NotificationContext;

