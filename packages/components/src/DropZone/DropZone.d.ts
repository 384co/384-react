import { Accept } from "react-dropzone";

export interface DropZoneProps extends React.PropsWithChildren<{}> {
    baseStyle?: React.CSSProperties,
    acceptStyle?: React.CSSProperties,
    rejectStyle?: React.CSSProperties,
    activeStyle?: React.CSSProperties,
    disabledStyle?: React.CSSProperties,
    focusedStyle?: React.CSSProperties,
    styles?: React.CSSProperties,
    dzRef?: Ref<DropzoneRef> | undefined,
    id?: string,
    noClick?: boolean,
    accept?: Accept,
    maxFiles?: number,
    onError?: (error: Error) => void,
    onDrop?: () => void,

}