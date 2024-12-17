import { User } from '@aimpact/agents-api/business/user';

export const prepare = (chat, user: User) => {
	const { module, activity } = chat.metadata;

	const lastMessage = chat.messages?.lastTwo.find(messages => messages.role === 'assistant');
	const synthesis = lastMessage?.metadata.synthesis ?? '';
	const progress = lastMessage?.metadata.progress ?? '';

	const objectiveProgress = progress?.objectives
		? JSON.stringify([{ ...synthesis, ...progress }])
		: `The conversation hasn't started yet.`;

	const { subject, role, instructions } = activity.resources.specs;
	const activityObjectives = activity.resources.specs?.objectives
		.map(objective => `* ${objective.name}: ${objective.objective}`)
		.join(`\n`);

	const literals = {
		user: user.displayName,
		age: module.audience ?? '',
		role: role,
		subject: subject,
		instructions: instructions ?? '',
		objective: activity.objective ?? '',
		'activity-objectives': activityObjectives,
		'activity-objectives-progress': objectiveProgress
	};

	return {
		category: 'agents',
		name: `ailearn.activity-${activity.type}-v2`,
		language: activity.language,
		literals
	};
};
