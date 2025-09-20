import { ErrorGenerator } from '@aimpact/agents-api/business/errors';
import type { IArticleData, IArticleDraftData, DraftType } from '@aimpact/agents-api/data/interfaces';

export const prepare = (draft: IArticleDraftData) => {
	const { id, creator, language, title, description, content, picture, editors } = draft;

	const errors: string[] = [];
	!id && errors.push('id');
	!creator && errors.push('creator');
	!language && errors.push('language');
	!title && errors.push('title');
	!description && errors.push('description');
	!content && errors.push('content');

	if (errors.length) return { errors: ErrorGenerator.invalidParametersForPublishing(id, errors) };

	const now = Date.now();
	const article: IArticleData = {
		id,
		creator,
		title,
		description,
		content,
		language,
		picture: picture ?? '',
		state: 'published',
		type: <DraftType>'article',
		timeCreated: now,
		timeUpdated: now,
		editors: editors ?? [creator],
		publicationDate: now
	};

	// Set the owner only if it is not the user who created the article
	if (draft.owner && draft.owner.id !== draft.creator.id) article.owner = draft.owner;
	draft.ai && (article.ai = draft.ai);

	// let error;
	// ({ error } = (() => {
	// 	let error;
	// 	for (let index = 0; index < draft.activities.length; ++index) {
	// 		const activity = draft.activities[index];
	// 		const { id, type, language, title, description } = activity;

	// 		const errors = [];
	// 		!id && errors.push('id');
	// 		!type && errors.push('type');
	// 		!language && errors.push('language');
	// 		!title && errors.push('title');
	// 		!description && errors.push('description');
	// 		type !== 'multiple-choice' && !objective && errors.push('objective');
	// 		if (errors.length) {
	// 			error = ErrorGenerator.activityNotValidToPublish(id, errors);
	// 			break;
	// 		}
	// 	}
	// 	return { error };
	// })());
	// if (error) return { errors: error };

	// const types: Set<ActivityType> = new Set<ActivityType>();
	// const items: Record<string, IActivityData> = {};
	// draft.activities.forEach(activity => {
	// 	let materials, specs;
	// 	({ materials, specs } = (() => {
	// 		// MATERIALS
	// 		const materials: Record<string, any> = {};
	// 		if (activity.type === 'multiple-choice')
	// 			materials.assessment = JSON.stringify({ title: activity.title, questions: activity.specs.questions });

	// 		if (activity.materials)
	// 			Object.entries(activity.materials).forEach(([prop, value]) => (materials[prop] = value));

	// 		// SPECS
	// 		const specs: Record<string, any> = {};
	// 		if (activity.type === 'debate') {
	// 			specs.role = activity.specs.role;
	// 			specs.subject = activity.specs.subject;
	// 		} else if (activity.type === 'character-talk') {
	// 			specs.role = activity.specs.role;
	// 		} else if (activity.type === 'content-theory') {
	// 			specs.topic = activity.specs.topic;
	// 		} else if (activity.type === 'exercise') {
	// 			specs.topic = activity.specs.topic;
	// 			specs.exercise = activity.specs.exercise;
	// 		} else if (activity.type === 'free-conversation') {
	// 			specs.requestedTask = activity.specs.requestedTask;
	// 		} else if (['spoken', 'written', 'hand-written'].includes(activity.type)) {
	// 			specs.assessment = activity.specs.assessment;
	// 			specs.criteria = activity.specs.criteria;
	// 		}

	// 		specs.task = activity.specs?.task ?? '';
	// 		specs.objectives = activity.specs?.objectives ?? '';
	// 		specs.instructions = activity.specs?.instructions ?? '';

	// 		return { materials, specs };
	// 	})());

	// 	const { id, type, language, title, description, picture, settings } = activity;

	// 	types.add(activity.type);
	// 	items[activity.id] = {
	// 		id,
	// 		type,
	// 		title,
	// 		description,
	// 		language,
	// 		picture: picture ?? '',
	// 		article: article,
	// 		resources: { materials, specs }
	// 	};
	// 	settings && (items[activity.id].settings = settings);
	// });

	// const order: string[] = draft.activities.sort((a, b) => a.order - b.order).map(activity => activity.id);

	return { item: article };
};
