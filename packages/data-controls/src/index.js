/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { controls as dataControls } from '@wordpress/data';
// TODO: mark the deprecated controls after all Gutenberg usages are removed
// import deprecated from '@wordpress/deprecated';

/**
 * Dispatches a control action for triggering an api fetch call.
 *
 * @param {Object} request Arguments for the fetch request.
 *
 * @example
 * ```js
 * import { apiFetch } from '@wordpress/data-controls';
 *
 * // Action generator using apiFetch
 * export function* myAction() {
 * 	const path = '/v2/my-api/items';
 * 	const items = yield apiFetch( { path } );
 * 	// do something with the items.
 * }
 * ```
 *
 * @return {Object} The control descriptor.
 */
export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

/**
 * Control for resolving a selector in a registered data store.
 * Alias for the `resolveSelect` built-in control in the `@wordpress/data` package.
 *
 * @param {Array} args Arguments passed without change to the `@wordpress/data` control.
 */
export function select( ...args ) {
	// deprecated( '`select` control in `@wordpress/data-controls`', {
	// 	alternative: 'built-in `resolveSelect` control in `@wordpress/data`',
	// } );

	return dataControls.resolveSelect( ...args );
}

/**
 * Control for calling a selector in a registered data store.
 * Alias for the `select` built-in control in the `@wordpress/data` package.
 *
 * @param {Array} args Arguments passed without change to the `@wordpress/data` control.
 */
export function syncSelect( ...args ) {
	// deprecated( '`syncSelect` control in `@wordpress/data-controls`', {
	// 	alternative: 'built-in `select` control in `@wordpress/data`',
	// } );

	return dataControls.select( ...args );
}

/**
 * Control for dispatching an action in a registered data store.
 * Alias for the `dispatch` control in the `@wordpress/data` package.
 *
 * @param {Array} args Arguments passed without change to the `@wordpress/data` control.
 */
export function dispatch( ...args ) {
	// deprecated( '`dispatch` control in `@wordpress/data-controls`', {
	// 	alternative: 'built-in `dispatch` control in `@wordpress/data`',
	// } );

	return dataControls.dispatch( ...args );
}

export const acquireStoreLock = function* ( scope, exclusive = true ) {
	return {
		type: 'ACQUIRE_STORE_LOCK',
		scope,
		exclusive,
	};
};

export const releaseStoreLock = function* ( lock ) {
	return {
		type: 'RELEASE_STORE_LOCK',
		lock,
	};
};

/**
 * The default export is what you use to register the controls with your custom
 * store.
 *
 * @param paths
 * @example
 * ```js
 * // WordPress dependencies
 * import { controls } from '@wordpress/data-controls';
 * import { registerStore } from '@wordpress/data';
 *
 * // Internal dependencies
 * import reducer from './reducer';
 * import * as selectors from './selectors';
 * import * as actions from './actions';
 * import * as resolvers from './resolvers';
 *
 * registerStore( 'my-custom-store', {
 * reducer,
 * controls,
 * actions,
 * selectors,
 * resolvers,
 * } );
 * ```
 * @return {Object} An object for registering the default controls with the
 * store.
 */
export const controls = {
	ACQUIRE_STORE_LOCK: ( { scope, exclusive } ) => {
		const promise = new Promise( ( resolve ) => {
			lockRequests.unshift( {
				exclusive,
				scope,
				notifyAcquired: resolve,
			} );
		} );
		acquireAvailableLocks();
		return promise;
	},

	RELEASE_STORE_LOCK: ( { lock } ) => {
		releaseLock( lock );
		// Run anything that got unblocked by releasing this lock in the next tick:
		setTimeout( () => {
			acquireAvailableLocks();
		} );
	},

	API_FETCH( { request } ) {
		return triggerFetch( request );
	},
};

const lockRequests = [];
const lockTree = {
	locks: [],
	children: {},
};

function acquireAvailableLocks() {
	for ( let i = lockRequests.length - 1; i >= 0; i-- ) {
		const { scope, exclusive, notifyAcquired } = lockRequests[ i ];
		const lock = acquireLock( scope, exclusive );
		if ( lock ) {
			// Remove the request from the queue
			lockRequests.splice( i, 1 );

			// Notify caller
			notifyAcquired( lock );
		}
	}
}

function acquireLock( path, exclusive ) {
	if ( ! lockAvailable( path, exclusive ) ) {
		return false;
	}

	const node = getNode( path );
	const lock = { path, exclusive };
	node.locks.push( lock );
	return lock;
}

function releaseLock( lock ) {
	const node = getNode( lock.path );
	node.locks.splice( node.locks.indexOf( lock ), 1 );
}

function lockAvailable( path, exclusive ) {
	let node;

	// Validate all parents and the node itself
	for ( node of iteratePath( path ) ) {
		if ( hasConflictingLock( exclusive, node.locks ) ) {
			return false;
		}
	}

	// Validate all nested nodes
	for ( const descendant of iterateDescendants( node ) ) {
		if ( hasConflictingLock( exclusive, descendant.locks ) ) {
			return false;
		}
	}

	return true;
}

function getNode( path ) {
	const nodes = Array.from( iteratePath( path ) );
	return nodes.shift();
}

function* iteratePath( path ) {
	const currentNode = lockTree;
	yield currentNode;
	for ( const branchName of path ) {
		if ( ! currentNode.children[ branchName ] ) {
			currentNode.children[ branchName ] = {
				locks: [],
				children: {},
			};
		}
		yield currentNode.children[ branchName ];
	}
}

function* iterateDescendants( node ) {
	const stack = [ node ];
	while ( stack.length ) {
		const childNode = stack.pop();
		yield childNode;
		stack.push( ...Object.values( childNode.children ) );
	}
}

function hasConflictingLock( exclusive, locks ) {
	if ( exclusive && locks.length ) {
		return true;
	}

	if ( ! exclusive && locks.filter( ( lock ) => lock.exclusive ).length ) {
		return true;
	}

	return false;
}
