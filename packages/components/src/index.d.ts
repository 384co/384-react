
export interface RootComponentProps extends React.HTMLAttributes<HTMLDivElement> {
    root: RootComponentProps;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

export * from './DropZone';
export * from './PageNotFound';