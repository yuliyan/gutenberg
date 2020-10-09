/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useState,
	useEffect,
	useRef,
	createPortal,
} from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	__experimentalLinkControl,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
	BlockList,
	__experimentalUseResizeCanvas as useResizeCanvas,
	useBlockSelectionClearer,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';

const alignmentFix = {
	css:
		'.wp-block[data-align="full"],.wp-block.alignfull{max-width:100vw!important;width:100vw!important;}',
};

function IframeContent( { children, doc, head, styles, bodyClassName } ) {
	const onFocus = useBlockSelectionClearer();

	useEffect( () => {
		doc.body.tabIndex = '-1';
		doc.body.addEventListener( 'focus', onFocus );

		return () => {
			doc.body.removeEventListener( 'focus', onFocus );
		};
	}, [ onFocus ] );

	useEffect( () => {
		doc.body.className = bodyClassName;
		doc.body.style.margin = '0';
		doc.head.innerHTML = head;
		doc.dir = document.dir;

		Array.from( document.body.classList ).forEach( ( name ) => {
			if ( name.startsWith( 'admin-color-' ) ) {
				doc.body.classList.add( name );
			}
		} );

		[ ...styles, alignmentFix ].forEach( ( { css } ) => {
			const styleEl = doc.createElement( 'style' );
			styleEl.innerHTML = css;
			doc.head.appendChild( styleEl );
		} );

		// Search the document for stylesheets targetting the editor canvas.
		Array.from( document.styleSheets ).forEach( ( styleSheet ) => {
			try {
				// May fail for external styles.
				// eslint-disable-next-line no-unused-expressions
				styleSheet.cssRules;
			} catch ( e ) {
				return;
			}

			const { ownerNode, cssRules } = styleSheet;

			if ( ! cssRules ) {
				return;
			}

			const isMatch = Array.from( cssRules ).find(
				( { selectorText } ) =>
					selectorText &&
					selectorText.includes( '.editor-styles-wrapper' )
			);

			if ( isMatch && ! doc.getElementById( ownerNode.id ) ) {
				doc.head.appendChild( ownerNode );
			}
		} );
	}, [] );

	return createPortal( children, doc.body );
}

export function IFrame( { children, head, styles, bodyClassName, ...props } ) {
	const [ doc, setDoc ] = useState();
	const ref = useRef();

	useEffect( () => {
		const _doc = ref.current.contentWindow.document;
		const { readyState } = _doc;

		if ( readyState === 'interactive' || readyState === 'complete' ) {
			setDoc( _doc );
		}
	}, [] );

	return (
		<iframe
			{ ...props }
			ref={ ref }
			title={ __( 'Editor canvas' ) }
			name="editor-canvas"
			data-loaded={ !! doc }
			onLoad={ () => {
				// Document is not immediately loaded in Firefox.
				setDoc( ref.current.contentWindow.document );
			} }
		>
			{ doc && (
				<IframeContent
					doc={ doc }
					head={ head }
					styles={ styles }
					bodyClassName={ bodyClassName }
				>
					{ children }
				</IframeContent>
			) }
		</iframe>
	);
}

export default function BlockEditor( { setIsInserterOpen } ) {
	const { settings, templateType, page, deviceType } = useSelect(
		( select ) => {
			const {
				getSettings,
				getTemplateType,
				getPage,
				__experimentalGetPreviewDeviceType,
			} = select( 'core/edit-site' );
			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getTemplateType(),
				page: getPage(),
				deviceType: __experimentalGetPreviewDeviceType(),
			};
		},
		[ setIsInserterOpen ]
	);
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

	const { setPage } = useDispatch( 'core/edit-site' );

	const inlineStyles = useResizeCanvas( deviceType );

	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<BlockEditorKeyboardShortcuts />
			<__experimentalLinkControl.ViewerFill>
				{ useCallback(
					( fillProps ) => (
						<NavigateToLink
							{ ...fillProps }
							activePage={ page }
							onActivePageChange={ setPage }
						/>
					),
					[ page ]
				) }
			</__experimentalLinkControl.ViewerFill>
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			<IFrame
				className="edit-site-visual-editor"
				style={ inlineStyles }
				head={ window.__editorStyles.html }
				styles={ settings.styles }
				bodyClassName="editor-styles-wrapper edit-site-block-editor__editor-styles-wrapper"
			>
				<WritingFlow>
					<ObserveTyping>
						<BlockList className="edit-site-block-editor__block-list" />
					</ObserveTyping>
				</WritingFlow>
			</IFrame>
		</BlockEditorProvider>
	);
}
