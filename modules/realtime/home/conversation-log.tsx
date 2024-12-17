import * as React from 'react';

interface ConversationItem {
	id: string;
	type: string;
	role?: string;
	formatted: {
		output?: string;
		tool?: {
			name: string;
			arguments: any;
		};
		transcript?: string;
		text?: string;
		audio?: any;
		file?: {
			url: string;
		};
	};
}

interface ConversationLogProps {
	items: ConversationItem[];
	deleteItem: (id: string) => void;
}

export function ConversationLog({ items, deleteItem }: ConversationLogProps): JSX.Element {
	return (
		<div className="content-block conversation">
			<div className="content-block-title">conversation</div>
			<div className="content-block-body" data-conversation-content>
				{!items.length && `awaiting connection...`}
				{items.map(conversationItem => (
					<div className="conversation-item" key={conversationItem.id}>
						<div className={`speaker ${conversationItem.role || ''}`}>
							<div>{(conversationItem.role || conversationItem.type).replaceAll('_', ' ')}</div>
							<div className="close" onClick={() => deleteItem(conversationItem.id)}>
								X
							</div>
						</div>
						<div className={`speaker-content`}>
							{conversationItem.formatted.output && <div>{conversationItem.formatted.output}</div>}
							{conversationItem.formatted.tool && (
								<div>
									{conversationItem.formatted.tool.name}({conversationItem.formatted.tool.arguments})
								</div>
							)}
							{conversationItem.formatted.transcript && (
								<div>{conversationItem.formatted.transcript}</div>
							)}
							{conversationItem.formatted.file && (
								<audio src={conversationItem.formatted.file.url} controls />
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
