/**
 * WordPress dependencies
 */
import { FontSizePicker, LineHeightControl } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { fromPx, toPx, GLOBAL_CONTEXT } from '../editor/utils';

export default ( {
	context: { supports, name },
	getMergedSetting,
	getStyleProperty,
	setStyleProperty,
} ) => {
	if (
		! supports.includes( 'fontSize' ) &&
		! supports.includes( 'lineHeight' )
	) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
			{ supports.includes( 'fontSize' ) && (
				<FontSizePicker
					value={ fromPx( getStyleProperty( name, 'fontSize' ) ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'fontSize', toPx( value ) )
					}
					fontSizes={
						getMergedSetting( name, 'typography.fontSizes' ) ??
						getMergedSetting(
							GLOBAL_CONTEXT,
							'typography.fontSizes'
						)
					}
					disableCustomFontSizes={
						! (
							getMergedSetting(
								name,
								'typography.customFontSize'
							) ??
							getMergedSetting(
								GLOBAL_CONTEXT,
								'typography.customFontSize'
							)
						)
					}
				/>
			) }
			{ supports.includes( 'lineHeight' ) && (
				<LineHeightControl
					value={ getStyleProperty( name, 'lineHeight' ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'lineHeight', value )
					}
				/>
			) }
		</PanelBody>
	);
};
