/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	LINK_COLOR,
	GLOBAL_CONTEXT,
	getPresetValueFromVariable,
	getPresetVariable,
} from '../editor/utils';
import ColorPalettePanel from './color-palette-panel';

export default ( {
	context: { supports, name },
	getStyleProperty,
	setStyleProperty,
	getSetting,
	getMergedSetting,
	setSetting,
} ) => {
	if (
		! supports.includes( 'color' ) &&
		! supports.includes( 'backgrounColor' ) &&
		! supports.includes( 'background' ) &&
		! supports.includes( LINK_COLOR )
	) {
		return null;
	}

	const settings = [];

	const colorPresets =
		getMergedSetting( name, 'color.palette' ) ??
		getMergedSetting( GLOBAL_CONTEXT, 'color.palette' );
	const gradientPresets =
		getMergedSetting( name, 'color.gradients' ) ??
		getMergedSetting( GLOBAL_CONTEXT, 'color.gradients' );

	if ( supports.includes( 'color' ) ) {
		const color = getStyleProperty( name, 'color' );

		settings.push( {
			colorValue:
				getPresetValueFromVariable( 'color', colorPresets, color ) ||
				color,
			onColorChange: ( value ) =>
				setStyleProperty(
					name,
					'color',
					getPresetVariable( 'color', colorPresets, value ) || value
				),
			label: __( 'Text color' ),
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		const backgroundColor = getStyleProperty( name, 'backgroundColor' );
		backgroundSettings = {
			colorValue:
				getPresetValueFromVariable(
					'color',
					colorPresets,
					backgroundColor
				) || backgroundColor,
			onColorChange: ( value ) =>
				setStyleProperty(
					name,
					'backgroundColor',
					getPresetVariable( 'color', colorPresets, value ) || value
				),
		};
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		const gradient = getStyleProperty( name, 'background' );
		gradientSettings = {
			gradientValue:
				getPresetValueFromVariable(
					'gradient',
					gradientPresets,
					gradient
				) || gradient,
			onGradientChange: ( value ) =>
				setStyleProperty(
					name,
					'background',
					getPresetVariable( 'gradient', gradientPresets, value ) ||
						value
				),
		};
	}

	if (
		supports.includes( 'background' ) ||
		supports.includes( 'backgroundColor' )
	) {
		settings.push( {
			...backgroundSettings,
			...gradientSettings,
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		settings.push( {
			colorValue: getStyleProperty( name, LINK_COLOR ),
			onColorChange: ( value ) =>
				setStyleProperty( name, LINK_COLOR, value ),
			label: __( 'Link color' ),
		} );
	}
	return (
		<PanelColorGradientSettings
			title={ __( 'Color' ) }
			settings={ settings }
			colors={ colorPresets }
			gradients={ gradientPresets }
			disableCustomColors={
				! (
					getMergedSetting( name, 'color.custom' ) ??
					getMergedSetting( GLOBAL_CONTEXT, 'color.custom' )
				)
			}
			disableCustomGradients={
				! (
					getMergedSetting( name, 'color.customGradient' ) ??
					getMergedSetting( GLOBAL_CONTEXT, 'color.customGradient' )
				)
			}
		>
			<ColorPalettePanel
				key={ 'color-palette-panel-' + name }
				contextName={ name }
				getSetting={ getSetting }
				setSetting={ setSetting }
			/>
		</PanelColorGradientSettings>
	);
};
