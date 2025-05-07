import { Chat } from '../chat';

export const v1 = (chat: Chat) => {
	const { module, activity } = chat.metadata;
	let error;

	const { subject, role, instructions } = activity.specs ?? activity.resources.specs;

	const name = chat.user.displayName.replace(/^(\S+).*/, '$1');
	const literals = {
		user: name,
		role: role ?? '',
		subject: subject ?? '',
		age: module.audience ?? '',
		objective: activity.objective,
		instructions: instructions ?? ''
	};

	return { prompt: `ailearn.activity-${activity.type}-v1`, literals, error };
};
