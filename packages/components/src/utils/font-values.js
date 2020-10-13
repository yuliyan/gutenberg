const DEFAULT = {
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
	fontSize: '13px',
};

const HELP_TEXT = {
	fontSize: '12px',
};

/**
 * @template {string} T
 * @type {Record<T, import('react').CSSProperties>}
 */
export default {
	default: DEFAULT,
	helpText: HELP_TEXT,
};
