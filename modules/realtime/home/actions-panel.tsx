import * as React from 'react';

interface ActionsPanelProps {
	isConnected: boolean;
	canPushToTalk: boolean;
	isRecording: boolean;
	connectConversation: () => void;
	disconnectConversation: () => void;
	startRecording: () => void;
	stopRecording: () => void;
}

export function ActionsPanel({
	isConnected,
	canPushToTalk,
	isRecording,
	connectConversation,
	disconnectConversation,
	startRecording,
	stopRecording
}: ActionsPanelProps): JSX.Element {
	return (
		<div className="content-actions">
			{isConnected && canPushToTalk && (
				<button
					onMouseDown={startRecording}
					onMouseUp={stopRecording}
					className={isRecording ? 'alert' : 'regular'}
				>
					{isRecording ? 'release to send' : 'push to talk'}
				</button>
			)}
			<div className="spacer" />
			<button
				onClick={isConnected ? disconnectConversation : connectConversation}
				className={isConnected ? 'regular' : 'action'}
			>
				{isConnected ? 'disconnect' : 'connect'}
			</button>
		</div>
	);
}
