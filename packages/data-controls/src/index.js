/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import {
	controls as dataControls,
	createRegistryControl,
} from '@wordpress/data';
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

export function atomicOperation( exclusive, scope, handler ) {
	return {
		type: 'ATOMIC_OPERATION',
		exclusive,
		scope,
		handler,
	};
}

/**
 * The default export is what you use to register the controls with your custom
 * store.
 *
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
 * 	reducer,
 * 	controls,
 * 	actions,
 * 	selectors,
 * 	resolvers,
 * } );
 * ```
 *
 * @return {Object} An object for registering the default controls with the
 *                  store.
 */
export const controls = {
	ATOMIC_OPERATION: createRegistryControl(
		( registry ) => ( { exclusive, scope, handler } ) => {
			const promise = new Promise( ( resolve ) => {
				enqueued.unshift( {
					exclusive,
					scope,
					handler,
					resolve,
				} );
			} );
			runQueue( registry );
			return promise;
		}
	),

	API_FETCH( { request } ) {
		return triggerFetch( request );
	},
};

const enqueued = [];
const inProgress = {
	operations: [],
	nestedScopes: {},
};

function runQueue( registry ) {
	const runnable = [];
	outer: for ( let i = enqueued.length - 1; i >= 0; i-- ) {
		const operation = enqueued[ i ];
		const { exclusive, scope } = operation;

		// Get to the targeted leaf
		let leaf = inProgress;
		const iterScope = [ ...scope ];
		do {
			if ( hasConflictingLock( exclusive, leaf.operations ) ) {
				continue outer;
			}
			const branchName = iterScope.shift();
			if ( ! leaf.nestedScopes[ branchName ] ) {
				leaf.nestedScopes[ branchName ] = {
					operations: [],
					nestedScopes: {},
				};
			}
			leaf = leaf.nestedScopes[ branchName ];
		} while ( iterScope.length );

		// Validate all nested scopes
		const stack = [ leaf ];
		while ( stack.length ) {
			const childLeaf = stack.pop();
			if ( hasConflictingLock( exclusive, childLeaf.operations ) ) {
				continue outer;
			}
			stack.push( ...Object.values( childLeaf.nestedScopes ) );
		}

		// Lock can be acquired! let's mark as runnable:
		enqueued.splice( i, 1 );
		runnable.push( { leaf, operation } );
	}

	// And run all runnables
	for ( const { leaf, operation } of runnable ) {
		const { handler } = operation;
		// , so let's acquire...
		leaf.operations.push( operation );
		// ...and start the operation in the next tick
		Promise.resolve()
			.then( () => handler( registry.dispatch ) )
			.finally( () => {
				// Once it's over, let's remove it from the stack...
				leaf.operations.splice(
					leaf.operations.indexOf( operation ),
					1
				);
				// ...and run what we can
				runQueue( registry );
			} );
	}
}

function hasConflictingLock( exclusive, operations ) {
	if ( exclusive && operations.length ) {
		return true;
	}

	if ( ! exclusive && operations.filter( ( op ) => op.exclusive ).length ) {
		return true;
	}

	return false;
}
