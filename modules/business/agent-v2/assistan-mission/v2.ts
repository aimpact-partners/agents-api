import { ProjectsAgents } from '@aimpact/agents-api/business/projects';
import { Chat } from '../chat';
import { ILanguage, defaultTexts } from '../common';

export const v2 = async (chat: Chat, lastMessage) => {
	const { project, metadata } = chat;
	const agentName = typeof project.agent === 'string' ? project.agent : metadata.activity?.type;
	const response = await ProjectsAgents.get(project.id, agentName);
	if (response.error) return { error: response.error };
	const agent = response.data;

	const literals: Record<string, string> = {};
	agent.literals.agent.pure.forEach(literal => (literals[literal] = chat.metadata[literal]));

	if (literals.user) {
		literals.user = literals.user.replace(/^(\S+).*/, '$1');
	}

	const defaultText = defaultTexts[<ILanguage>chat.metadata.language];

	const objectives = metadata?.objectives ?? metadata['activity-objectives']; // property backward support
	literals.objectives = JSON.stringify(objectives);

	const summary = lastMessage?.metadata.summary ?? defaultText;
	literals.summary = summary;

	let objectiveProgress;
	const progress = lastMessage?.metadata.progress ?? {};
	if (progress.objectives) {
		objectiveProgress = progress.objectives?.map(obj => ({
			name: obj.name,
			progress: obj.progress,
			status: obj.status
		}));
		objectiveProgress = JSON.stringify(objectiveProgress);
	} else objectiveProgress = defaultText;
	literals.progress = objectiveProgress;

	const { activity } = chat.metadata;

	return { prompt: `ailearn.activity-${activity.type}-v2`, literals };
};
