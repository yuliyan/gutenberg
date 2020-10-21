/**
 * External dependencies
 */
const { ExternalsPlugin } = require( 'webpack' );

/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new ExternalsPlugin( 'var', {
			'@wordpress/blob': 'wp.blob',
			'rxjs/operators': 'rxjs.operators',
			rxjs: true,
		} ),
		new DependencyExtractionWebpackPlugin(),
	],
};
