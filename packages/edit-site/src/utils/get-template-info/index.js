/**
 * Internal dependencies
 */
import { TEMPLATES_DEFAULT_DETAILS } from './constants';

/**
 * Given a template entity, return information about it which is ready to be
 * rendered, such as the title and description.
 *
 * @param {Object} template The template for which we need information.
 * @param {Object} defaultTemplateDetails An optional list of default template details.
 * @return {Object} Information about the template, including title and description.
 */
export default function getTemplateInfo(
	template,
	defaultTemplateDetails = {}
) {
	if ( ! template ) {
		return {};
	}

	if ( 'wp_template_part' === template.type ) {
		return { title: template.slug, description: '' };
	}

	const { title: defaultTitle, description: defaultDescription } =
		defaultTemplateDetails[ template.slug ] ||
		TEMPLATES_DEFAULT_DETAILS[ template.slug ] ||
		{};

	const title = template?.title?.rendered || defaultTitle || template.slug;
	const description = template?.excerpt?.raw || defaultDescription;
	return { title, description };
}
