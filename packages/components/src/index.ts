export interface RootComponentProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

export * from './DropZone';
export * from './PageNotFound';