import React from 'react';
import type { ControllerProps } from '../types';

/**
 * Controller component - groups routes under a common path prefix
 * 
 * @example
 * <Controller path="/api">
 *   <Route path="/users" method="GET" onRequest={() => []} />
 * </Controller>
 */
export function Controller(props: ControllerProps): React.ReactElement {
    return React.createElement(React.Fragment, null, props.children);
}

Controller.displayName = 'Controller';
