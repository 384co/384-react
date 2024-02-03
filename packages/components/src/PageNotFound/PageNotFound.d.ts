import * as React from 'react';
import { RootComponentProps } from '../';

export interface PageNotFoundProps extends RootComponentProps {
    LinkComponent?: React.ComponentType<any>;
    linkProps?: any;
    rootProps?: any;
}