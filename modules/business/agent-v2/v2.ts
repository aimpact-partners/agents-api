// // import type { IAgentRequestParams } from '@aimpact/agents-client/agent';
// // import type { ITeacherChatMetadata } from '../interfaces';

// export const v2 = (params, type: string) => {
// 	const { messages, user } = params;
// 	const { module, activity } = params.metadata;

// 	const lastMessage = messages?.last.find(messages => messages.role === 'assistant');
// 	const synthesis = lastMessage?.metadata.synthesis ?? '';
// 	const progress = lastMessage?.metadata.progress ?? '';

// 	const { subject, role, instructions } = activity.resources.specs;

// 	const activityObjectives = activity.resources.specs?.objectives
// 		.map(objective => `* ${objective.name}: ${objective.objective}`)
// 		.join(`\n`);

// 	const objectiveProgress = progress?.objectives
// 		? JSON.stringify([{ ...synthesis, ...progress }])
// 		: `The conversation hasn't started yet.`;

// 	const ipe = [];
// 	ipe.push({
// 		responseFormat: 'json',
// 		prompt: { category: 'agents', name: `ailearn.${type}-summary` },
// 		literals: {
// 			user: user.displayName,
// 			age: module.audience ?? '',
// 			role: role ?? '',
// 			subject: subject ?? '',
// 			prompt: params.prompt,
// 			instructions: instructions ?? '',
// 			'activity-objectives-progress': objectiveProgress
// 		}
// 	});
// 	ipe.push({
// 		responseFormat: 'json',
// 		prompt: { category: 'agents', name: `ailearn.${type}-ipe` },
// 		literals: {
// 			user: user.displayName,
// 			age: module.audience ?? '',
// 			role: role ?? '',
// 			subject: subject ?? '',
// 			prompt: params.prompt,
// 			previous: lastMessage?.content ?? '',
// 			'activity-objectives': activityObjectives,
// 			'activity-objectives-progress': objectiveProgress
// 		}
// 	});

// 	const system = { prompt: { category: 'agents', name: `ailearn.activity-${type}-v2` } };
// 	const literals = {
// 		user: user.displayName,
// 		age: module.audience ?? '',
// 		role: role,
// 		subject: subject,
// 		topic: activity.resources?.specs?.topic ?? '',
// 		instructions: instructions ?? '',
// 		objective: activity.objective ?? '',
// 		'activity-objectives': activityObjectives,
// 		'activity-objectives-progress': objectiveProgress
// 	};

// 	return { system, literals, ipe };
// };
