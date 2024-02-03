'use client';
import * as React from 'react';
import { PageNotFoundProps } from './PageNotFound.d';

const PageNotFound = function PageNotFound(props: PageNotFoundProps) {
    return (
        <div style={{ width: '100%', height: '100%' }} {...props.rootProps}>
            <object type="image/svg+xml" data="https://cdn.svgator.com/images/2022/01/404-svg-animation.svg" aria-label="Kitty Yarn Play 404 SVG animation example" width="100%"></object>
            {props.LinkComponent && <props.LinkComponent {...props.linkProps} />}
            {!props.LinkComponent && <a href={'/'} style={{ position: 'absolute', top: 72, left: 48, textTransform: 'none', textDecoration: "none" }} {...props.linkProps}>Go Home</a>}
        </div>
    );
}

export { PageNotFound };