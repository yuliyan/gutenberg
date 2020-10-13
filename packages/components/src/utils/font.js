/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import FONT from './font-values';

/**
 * @param {import('lodash').PropertyPath} value
 * @return {string} Style value
 */
export function font( value ) {
	return get( FONT, value, '' );
}
