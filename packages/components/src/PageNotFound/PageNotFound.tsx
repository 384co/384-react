'use client';
import * as React from 'react';
var data = "<object type=\"image/svg+xml\" data=\"https://cdn.svgator.com/images/2022/01/404-svg-animation.svg\" alt=\"Kitty Yarn Play 404 SVG animation example\" img=\"\" width=\"100%\"></object>";
const PageNotFound = React.forwardRef(function PageNotFound() {
    return (<div>
        <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: data }}>
        </div>
        <a href={'/'} style={{ position: 'fixed', top: 72, left: 48, textTransform: 'none', textDecoration: "none" }} >Go Home</a>
    </div>);
})

export { PageNotFound as default };